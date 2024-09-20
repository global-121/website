import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { FinancialServiceProviderCallbackQueueNames } from '@121-service/src/financial-service-provider-callback-job-processors/enum/financial-service-provider-callback-queue-names.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaymentQueueNames } from '@121-service/src/payments/enum/payment-queue-names.enum';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTimeoutCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback-job.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(
      FinancialServiceProviderCallbackQueueNames.safaricomTransferCallback,
    )
    private readonly safaricomTransferCallbackQueue: Queue,
    @InjectQueue(
      FinancialServiceProviderCallbackQueueNames.safaricomTimeoutCallback,
    )
    private readonly safaricomTimeoutCallbackQueue: Queue,
  ) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async saveAndDoTransfer({
    transactionId,
    transferAmount,
    phoneNumber,
    idNumber,
    remarks,
    originatorConversationId,
  }: DoTransferParams): Promise<void> {
    // Store initial transfer record before transfer because of callback
    const safaricomTransfer = new SafaricomTransferEntity();
    safaricomTransfer.originatorConversationId = originatorConversationId;
    safaricomTransfer.transactionId = transactionId;
    await this.safaricomTransferScopedRepository.save(safaricomTransfer);

    // Prepare the transfer payload and send the request to safaricom
    const transferResult =
      await this.safaricomApiService.sendTransferAndHandleResponse({
        transactionId,
        transferAmount,
        phoneNumber,
        idNumber,
        remarks,
        originatorConversationId,
      });

    // Update transfer record with conversation ID
    await this.safaricomTransferScopedRepository.update(
      { id: safaricomTransfer.id },
      { mpesaConversationId: transferResult?.data?.ConversationID },
    );
  }

  public async processTransferCallback(
    safaricomTransferCallback: SafaricomTransferCallbackDto,
  ): Promise<void> {
    const safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto = {
      originatorConversationId:
        safaricomTransferCallback.Result.OriginatorConversationID,
      mpesaConversationId: safaricomTransferCallback.Result.ConversationID,
      mpesaTransactionId: safaricomTransferCallback.Result.TransactionID,
      resultCode: safaricomTransferCallback.Result.ResultCode,
      resultDescription: safaricomTransferCallback.Result.ResultDesc,
    };

    const job = await this.safaricomTransferCallbackQueue.add(
      PaymentQueueNames.financialServiceProviderCallback,
      safaricomTransferCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }

  public async processTimeoutCallback(
    safaricomTimeoutCallback: SafaricomTimeoutCallbackDto,
  ): Promise<void> {
    const safaricomTimeoutCallbackJob: SafaricomTimeoutCallbackJobDto = {
      originatorConversationId:
        safaricomTimeoutCallback.OriginatorConversationID,
    };

    const job = await this.safaricomTimeoutCallbackQueue.add(
      PaymentQueueNames.financialServiceProviderTimeoutCallback,
      safaricomTimeoutCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }
}
