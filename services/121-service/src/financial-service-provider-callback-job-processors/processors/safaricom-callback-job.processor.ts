import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { FinancialServiceProviderCallbackQueueNames } from '@121-service/src/financial-service-provider-callback-job-processors/enum/financial-service-provider-callback-queue-names.enum';
import { FinancialServiceProviderCallbackJobProcessorsService } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.service';
import { PaymentQueueNames } from '@121-service/src/payments/enum/payment-queue-names.enum';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';

@Processor(FinancialServiceProviderCallbackQueueNames.safaricomTransferCallback)
export class TransferCallbackJobProcessorSafaricom {
  constructor(
    private readonly financialServiceProviderCallbackJobProcessorsService: FinancialServiceProviderCallbackJobProcessorsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(PaymentQueueNames.financialServiceProviderCallback)
  async handleSafaricomTransferCallbackJob(job: Job): Promise<void> {
    try {
      await this.financialServiceProviderCallbackJobProcessorsService.processSafaricomTransferCallbackJob(
        job.data,
      );
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
    }
  }
}
