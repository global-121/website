import instanceDrc from '@121-service/seed-data/instance/instance-drc.json';
import messageTemplateDrc from '@121-service/seed-data/message-template/message-template-drc.json';
import programDrc from '@121-service/seed-data/program/program-drc.json';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedProgramDrc implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDrc, isApiTests);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDrc, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDrc);
  }
}
