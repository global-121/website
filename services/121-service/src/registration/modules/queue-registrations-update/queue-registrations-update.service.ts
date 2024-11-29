import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { ProcessNameRegistration } from '@121-service/src/shared/enum/queue-process.names.enum';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

@Injectable()
export class QueueRegistrationUpdateService {
  public constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    private readonly queueRegistryService: QueueRegistryService,
  ) {}

  public async addRegistrationUpdateToQueue(
    job: RegistrationsUpdateJobDto,
  ): Promise<void> {
    job.request = {
      userId: this.request.user?.id,
      scope: this.request.user?.scope,
    };
    await this.queueRegistryService.updateRegistrationQueue.add(
      ProcessNameRegistration.update,
      job,
    );
  }
}
