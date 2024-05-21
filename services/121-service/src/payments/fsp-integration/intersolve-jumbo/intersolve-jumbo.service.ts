import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { PreOrderInfoDto } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/dto/pre-order-info.dto';
import { IntersolveJumboPaymentInfoEnum } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-payment-info.enum';
import { IntersolveJumboResultCode } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-result-code.enum';
import { IntersolveJumboApiService } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.api.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationDataOptions } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class IntersolveJumboService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  private readonly apiBatchSize = 500;

  public constructor(
    private readonly intersolveJumboApiService: IntersolveJumboApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationDataQueryService: RegistrationDataScopedQueryService,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async sendPayment(
    paPaymentArray: PaPaymentDataDto[],
    programId: number,
    payment: number,
  ): Promise<void> {
    // Split into batches
    const batches: PaPaymentDataDto[][] = [];
    for (let i = 0; i < paPaymentArray.length; i += this.apiBatchSize) {
      const batch: PaPaymentDataDto[] = paPaymentArray.slice(
        i,
        i + this.apiBatchSize,
      );
      batches.push(batch);
    }
    for (const batch of batches) {
      let batchResult: PaTransactionResultDto[] = [];
      batchResult = await this.sendBatchPayment(
        batch,
        payment,
        batch[0].bulkSize,
      );
      for (const paResult of batchResult) {
        await this.storeTransactionResult(
          paResult,
          payment,
          1,
          programId,
          paPaymentArray[0].userId,
        );
      }
    }
  }

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  private async getPaPaymentDetails(
    paPaymentArray: PaPaymentDataDto[],
  ): Promise<PreOrderInfoDto[]> {
    const referenceIds = paPaymentArray.map((pa) => pa.referenceId);
    const relationOptions = await this.getRelationOptionsForJumbo(
      referenceIds[0],
    );
    const jumboAdressInfoDtoArray =
      await this.registrationDataQueryService.getPaDetails(
        referenceIds,
        relationOptions,
      );

    // Maps the registration data back to the correct amounts using referenceID
    const result = jumboAdressInfoDtoArray.map((v) => ({
      ...v,
      ...paPaymentArray.find((s) => s.referenceId === v.referenceId),
    }));

    return result;
  }

  private async getRelationOptionsForJumbo(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
    const registrationDataOptions: RegistrationDataOptions[] = [];
    for (const attr of Object.values(IntersolveJumboPaymentInfoEnum)) {
      const relation = await this.registrationDataService.getRelationForName(
        registration,
        attr,
      );
      const registrationDataOption = {
        name: attr,
        relation: relation,
      };
      registrationDataOptions.push(registrationDataOption);
    }
    return registrationDataOptions;
  }

  private async sendBatchPayment(
    paPaymentArray: PaPaymentDataDto[],
    payment: number,
    bulkSizeCompletePayment: number,
  ): Promise<PaTransactionResultDto[]> {
    const batchResult: PaTransactionResultDto[] = [];
    const paymentDetailsArray = await this.getPaPaymentDetails(paPaymentArray);

    let preOrderResultFinished = false;
    let preOrderResult;
    while (preOrderResultFinished === false) {
      // Create pre-order
      preOrderResult = await this.intersolveJumboApiService.createPreOrder(
        paymentDetailsArray,
        payment,
      );

      // If API-calls for general reason (e.g. timeout) return early with failed transactions
      if (!preOrderResult?.['tns:CreatePreOrderResponse']) {
        console.log(
          'An error occured while doing the create pre-order request.',
        );
        for (const paymentDetails of paymentDetailsArray) {
          const transactionResult = this.createTransactionResult(
            paymentDetails.transactionAmount,
            paymentDetails.referenceId,
            `A general error occured while creating batch pre-order.`,
            StatusEnum.error,
          );
          batchResult.push(transactionResult);
        }
        return batchResult;
      }

      const resultCode =
        preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
          .ResultCode._cdata;
      if (resultCode === IntersolveJumboResultCode.Ok) {
        // if OK, skip out of while loop
        preOrderResultFinished = true;
      } else {
        // if not OK
        const resultDescription =
          preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
            .ResultDescription._cdata;
        const errorMessage = `Something went wrong while creating pre-order: ${resultCode} - ${resultDescription}`;
        if (resultCode === IntersolveJumboResultCode.InvalidOrderLine) {
          // if due to invalid order line, get error line number
          const errorLineNumber = resultDescription
            .split(':')[0]
            .split('OrderLine ')[1];
          const errorIndex = Number(errorLineNumber) - 1;

          // Create failed transaction for this PA
          const transactionResult = this.createTransactionResult(
            paymentDetailsArray[errorIndex].transactionAmount,
            paymentDetailsArray[errorIndex].referenceId,
            errorMessage,
            StatusEnum.error,
          );
          batchResult.push(transactionResult);

          // Remove PA from batch and start while loop from the top to retry
          paymentDetailsArray.splice(errorIndex, 1);

          // except if nothing left in batch, then return early
          if (paymentDetailsArray.length === 0) {
            return batchResult;
          }
        } else {
          // if another error than invalidOrderLine, then we cannot fix it per PA, skip out of while loop
          preOrderResultFinished = true;

          // .. and create failed transactions for remaining PAs
          for (const paymentDetails of paymentDetailsArray) {
            const transactionResult = this.createTransactionResult(
              paymentDetails.transactionAmount,
              paymentDetails.referenceId,
              errorMessage,
              StatusEnum.error,
            );
            batchResult.push(transactionResult);
          }
          // .. and return early
          return batchResult;
        }
      }
    }

    // Approve pre-order
    const approvePreorderResult = await this.approvePreOrder(
      preOrderResult,
      paymentDetailsArray,
      batchResult,
      bulkSizeCompletePayment,
    );
    return approvePreorderResult;
  }

  private async approvePreOrder(
    batchPreOrderResult: any,
    preOrderInfoArray: PreOrderInfoDto[],
    batchResult: PaTransactionResultDto[],
    bulkSizeCompletePayment: number,
  ): Promise<PaTransactionResultDto[]> {
    const approvePreOrderResult =
      await this.intersolveJumboApiService.approvePreOrder(batchPreOrderResult);
    if (
      approvePreOrderResult?.['tns:ApprovePreOrderResponse']?.WebserviceRequest
        ?.ResultCode?._cdata === IntersolveJumboResultCode.Ok
    ) {
      for (const paymentInfo of preOrderInfoArray) {
        const calculatedAmount = paymentInfo.transactionAmount;
        const transactionNotification = {
          notificationKey: ProgramNotificationEnum.jumboCardSent,
          dynamicContent: [String(calculatedAmount)],
          bulkSize: bulkSizeCompletePayment,
        };
        const transactionResult = this.createTransactionResult(
          calculatedAmount,
          paymentInfo.referenceId,
          null,
          StatusEnum.success,
          [transactionNotification],
        );

        batchResult.push(transactionResult);
      }
      return batchResult;
    } else {
      const errorMessage = !approvePreOrderResult?.[
        'tns:ApprovePreOrderResponse'
      ]
        ? `A general error occured while approving pre-order.`
        : `Something went wrong while approving pre-order: ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
      for (const paymentInfo of preOrderInfoArray) {
        const transactionResult = this.createTransactionResult(
          paymentInfo.transactionAmount,
          paymentInfo.referenceId,
          errorMessage,
          StatusEnum.error,
        );
        batchResult.push(transactionResult);
      }
      return batchResult;
    }
  }

  private async storeTransactionResult(
    paTransactionResult: PaTransactionResultDto,
    paymentNr: number,
    transactionStep: number,
    programId: number,
    userId: number,
  ): Promise<void> {
    await this.transactionsService.storeTransactionUpdateStatus(
      paTransactionResult,
      { programId, paymentNr, userId },
      transactionStep,
    );
  }

  private createTransactionResult(
    amount: number,
    referenceId: string,
    errorMessage: string,
    status: StatusEnum,
    notificationObjects?: TransactionNotificationObject[],
  ): PaTransactionResultDto {
    const transactionResult = new PaTransactionResultDto();
    transactionResult.referenceId = referenceId;
    transactionResult.status = status ? status : StatusEnum.success;
    transactionResult.message = errorMessage;
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.fspName =
      FinancialServiceProviderName.intersolveJumboPhysical;
    transactionResult.notificationObjects = notificationObjects;

    return transactionResult;
  }
}
