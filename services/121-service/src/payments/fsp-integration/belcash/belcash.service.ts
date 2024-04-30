import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialServiceProviderName } from '../../../financial-service-provider/enum/financial-service-provider-name.enum';
import { ProgramEntity } from '../../../programs/program.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { waitFor } from '../../../utils/waitFor.helper';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '../../dto/transaction-relation-details.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { BelcashRequestEntity } from './belcash-request.entity';
import { BelcashTransferPayload } from './belcash-transfer-payload.dto';
import { BelcashApiService } from './belcash.api.service';
import { BelcashPaymentStatusDto } from './dto/belcash-payment-status.dto';

@Injectable()
export class BelcashService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(BelcashRequestEntity)
  private readonly belcashRequestRepository: Repository<BelcashRequestEntity>;

  public constructor(
    private readonly belcashApiService: BelcashApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.belcash;

    const program = await this.programRepository.findOneBy({
      id: programId,
    });

    const authorizationToken = await this.belcashApiService.authenticate();

    for (const payment of paymentList) {
      const payload = this.createPayloadPerPa(
        payment,
        paymentNr,
        payment.transactionAmount,
        program.currency,
        program.id,
        payment.userId,
      );

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
        authorizationToken,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);

      const transactionRelationDetails: TransactionRelationDetailsDto = {
        programId,
        paymentNr: paymentNr,
        userId: payment.userId,
      };
      // Storing the per payment so you can continiously seed updates of transactions in Portal
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        transactionRelationDetails,
      );
    }

    return fspTransactionResult;
  }

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    paymentNr: number,
    amount: number,
    currency: string,
    programId: number,
    userId: number,
  ): BelcashTransferPayload {
    const payload = {
      amount: amount,
      to: `+${paymentData.paymentAddress}`,
      currency: currency,
      description: `121 program: payment ${paymentNr}`,
      tracenumber: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_user-${userId}_timestamp-${+new Date()}`,
      referenceid: `referenceId-${
        paymentData.referenceId
      }_program-${programId}_payment-${paymentNr}_user-${userId}_timestamp-${+new Date()}`,
      notifyto: true,
      notifyfrom: false,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: BelcashTransferPayload,
    referenceId: string,
    authorizationToken: string,
  ): Promise<PaTransactionResultDto> {
    // Wait to not overload belcash server
    await waitFor(2_000);

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FinancialServiceProviderName.belcash;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.amount;

    const result = await this.belcashApiService.transfer(
      payload,
      authorizationToken,
    );

    if ([200, 201].includes(result.status)) {
      paTransactionResult.status = StatusEnum.waiting;
      paTransactionResult.message =
        'Payment request sent succesfully. Awaiting status update.';
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.data.error.message;
    }
    return paTransactionResult;
  }

  public async processTransactionStatus(
    belcashCallbackData: BelcashPaymentStatusDto,
  ): Promise<void> {
    const belcashRequest =
      await this.belcashRequestRepository.save(belcashCallbackData);

    const successStatuses = ['PROCESSED'];
    const errorStatuses = ['CANCELED', 'EXPIRED', 'DENIED', 'FAILED'];

    if (
      [...successStatuses, ...errorStatuses].includes(belcashRequest.status)
    ) {
      // Unclear as of yet when which attribute is returned, but we pass equal values to both attributes
      const matchingString =
        belcashRequest.referenceid || belcashRequest.tracenumber;

      if (matchingString) {
        const referenceId = matchingString
          .split('_')[0]
          .replace('referenceId-', '');
        const programId = Number(
          matchingString.split('_')[1].replace('program-', ''),
        );
        const payment = Number(
          matchingString.split('_')[2].replace('payment-', ''),
        );
        const userId = Number(
          matchingString.split('_')[3].replace('user-', ''),
        );

        const paTransactionResult = new PaTransactionResultDto();
        paTransactionResult.fspName = FinancialServiceProviderName.belcash;
        paTransactionResult.referenceId = referenceId;
        paTransactionResult.status = successStatuses.includes(
          belcashRequest.status,
        )
          ? StatusEnum.success
          : StatusEnum.error;
        paTransactionResult.message = belcashRequest.status;
        paTransactionResult.calculatedAmount = Number(belcashRequest.amount);

        const transactionRelationDetails: TransactionRelationDetailsDto = {
          programId,
          paymentNr: payment,
          userId,
        };

        await this.transactionsService.storeTransactionUpdateStatus(
          paTransactionResult,
          transactionRelationDetails,
        );
      }
    }
  }
}
