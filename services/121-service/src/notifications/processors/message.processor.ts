import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageService } from '@121-service/src/notifications/message.service';
import { QueueNameCreateMessage } from '@121-service/src/queues-registry/enum/queue-names-create-message.enum';

@Processor(QueueNameCreateMessage.replyOnIncoming)
export class MessageProcessorReplyOnIncoming {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.smallBulk)
export class MessageProcessorSmallBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.mediumBulk)
export class MessageProcessorMediumBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.largeBulk)
export class MessageProcessorLargeBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.lowPriority)
export class MessageProcessorLowPriority {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}
