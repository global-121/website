import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { QueueNameMessageCallBack } from '@121-service/src/queues/enum/queue-names-message-callback.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
@Processor(QueueNameMessageCallBack.incomingMessage)
export class MessageIncomingProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
    private readonly azureLogService: AzureLogService,
  ) {}

  @Process(ProcessNameMessage.whatsapp)
  async handleIncomingWhatsapp(job: Job): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService
      .processIncomingWhatsapp(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }
}
