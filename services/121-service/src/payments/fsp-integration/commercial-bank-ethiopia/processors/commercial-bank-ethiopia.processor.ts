import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';
import { TransactionQueueNames } from '@121-service/src/shared/enum/transaction-queue-names.enum';
import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

@Processor(TransactionQueueNames.paymentCommercialBankEthiopia)
export class PaymentProcessorCommercialBankEthiopia {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(PaymentQueueNames.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.commercialBankEthiopiaService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}
