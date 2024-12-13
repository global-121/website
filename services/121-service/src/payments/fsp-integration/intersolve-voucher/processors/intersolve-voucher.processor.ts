import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import Redis from 'ioredis';

import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueueNamesTransactionJob } from '@121-service/src/queues/enum/queue-names-transaction-jobs.enum';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Processor(QueueNamesTransactionJob.intersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  @Process(JobNames.default)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVoucherService.processQueuedPayment(job.data);
    await this.redisClient.srem(getRedisSetName(job.data.programId), job.id);
  }
}
