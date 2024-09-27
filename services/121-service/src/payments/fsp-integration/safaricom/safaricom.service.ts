import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { Redis } from 'ioredis';
import { Equal } from 'typeorm';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTimeoutCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback-job.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { SafaricomCallbackQueueNames } from '@121-service/src/payments/fsp-integration/safaricom/enum/safaricom-callback-queue-names.enum';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(SafaricomCallbackQueueNames.transfer)
    private readonly safaricomTransferCallbackQueue: Queue,
    @InjectQueue(SafaricomCallbackQueueNames.timeout)
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
    originatorConversationId,
  }: DoTransferParams): Promise<void> {
    // ##TODO: can we move this save to transaction-job-processors.service to put it together with transaction save?
    // Check if transfer record exists already, if so, use that
    let safaricomTransfer =
      await this.safaricomTransferScopedRepository.findOne({
        where: {
          originatorConversationId: Equal(originatorConversationId),
        },
      });
    if (!safaricomTransfer) {
      // otherwise, create a new record
      const newSafaricomTransfer = new SafaricomTransferEntity();
      newSafaricomTransfer.originatorConversationId = originatorConversationId;
      newSafaricomTransfer.transactionId = transactionId;
      safaricomTransfer =
        await this.safaricomTransferScopedRepository.save(newSafaricomTransfer);
    }

    // Prepare the transfer payload and send the request to safaricom
    const transferResult =
      await this.safaricomApiService.sendTransferAndHandleResponse({
        transactionId,
        transferAmount,
        phoneNumber,
        idNumber,
        originatorConversationId,
      });

    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // It can be placed before or after the API call, as these are different scenarios to test
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    // Update transfer record with conversation ID
    await this.safaricomTransferScopedRepository.update(
      { id: safaricomTransfer.id },
      {
        mpesaConversationId: transferResult?.data?.ConversationID,
      },
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
      JobNames.default,
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
      JobNames.default,
      safaricomTimeoutCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }
}
