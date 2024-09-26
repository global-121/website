import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { EventsService } from '@121-service/src/events/events.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationsUpdateJobDto as RegistrationUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { ValidationConfigDto } from '@121-service/src/registration/dto/validate-registration-config.dto';
import {
  AttributeWithOptionalLabel,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationCsvValidationEnum } from '@121-service/src/registration/enum/registration-csv-validation.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

const BATCH_SIZE = 500;
const MASS_UPDATE_ROW_LIMIT = 100000;

@Injectable()
export class RegistrationsImportService {
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly actionService: ActionsService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly programService: ProgramService,
    private readonly fileImportService: FileImportService,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly eventsService: EventsService,
    private readonly queueRegistrationUpdateService: QueueRegistrationUpdateService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
  ) {}

  public async patchBulk(
    csvFile: any,
    programId: number,
    userId: number,
    reason: string,
  ): Promise<void> {
    const bulkUpdateRecords = await this.fileImportService.validateCsv(
      csvFile,
      MASS_UPDATE_ROW_LIMIT,
    );
    const columnNames = Object.keys(bulkUpdateRecords[0]);
    const validatedRegistrations = await this.validateBulkUpdateInput(
      bulkUpdateRecords,
      programId,
      userId,
    );

    // Filter out only columns that were in the original csv
    const filteredRegistrations = validatedRegistrations.map((registration) => {
      return columnNames.reduce((acc, key) => {
        if (key in registration) {
          acc[key] = registration[key];
        }
        return acc;
      }, {});
    });

    // Prepare the job array to push to the queue
    const updateJobs: RegistrationUpdateJobDto[] = filteredRegistrations.map(
      (registration) => {
        const updateData = { ...registration };
        delete updateData['referenceId'];
        return {
          referenceId: registration['referenceId'],
          data: updateData,
          programId,
          reason,
        } as RegistrationUpdateJobDto;
      },
    );

    // Call to redis as concurrent operations in a batch
    for (let start = 0; start < updateJobs.length; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE, updateJobs.length);
      await Promise.allSettled(
        updateJobs
          .slice(start, end)
          .map((job) =>
            this.queueRegistrationUpdateService.addRegistrationUpdateToQueue(
              job,
            ),
          ),
      );
    }
  }

  public async getImportRegistrationsTemplate(
    programId: number,
  ): Promise<string[]> {
    const genericAttributes: string[] = [
      GenericRegistrationAttributes.referenceId,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
    ];
    const dynamicAttributes: string[] = (
      await this.getDynamicAttributes(programId)
    ).map((d) => d.name);

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    // If paymentAmountMultiplier automatic, then drop from template
    if (!program.paymentAmountMultiplierFormula) {
      genericAttributes.push(
        String(GenericRegistrationAttributes.paymentAmountMultiplier),
      );
    }
    if (program.enableMaxPayments) {
      genericAttributes.push(String(GenericRegistrationAttributes.maxPayments));
    }
    if (program.enableScope) {
      genericAttributes.push(String(GenericRegistrationAttributes.scope));
    }

    const attributes = genericAttributes.concat(dynamicAttributes);
    return [...new Set(attributes)]; // Deduplicates attributes
  }

  public async importRegistrations(
    csvFile: Express.Multer.File,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedRegistrations(
      csvFile,
      program.id,
      userId,
    );
    return await this.importValidatedRegistrations(
      validatedImportRecords,
      program,
      userId,
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    let countImported = 0;
    const dynamicAttributes = await this.getDynamicAttributes(program.id);
    const registrations: RegistrationEntity[] = [];
    const customDataList: Record<string, unknown>[] = [];
    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = record.referenceId || uuid();
      registration.phoneNumber = record.phoneNumber ?? null;
      registration.preferredLanguage = record.preferredLanguage ?? null;
      registration.program = program;
      registration.inclusionScore = 0;
      registration.registrationStatus = RegistrationStatusEnum.registered;
      const customData = {};
      if (!program.paymentAmountMultiplierFormula) {
        registration.paymentAmountMultiplier =
          record.paymentAmountMultiplier || 1;
      }
      if (program.enableMaxPayments) {
        registration.maxPayments = record.maxPayments;
      }
      if (program.enableScope) {
        registration.scope = record.scope || '';
      }
      for await (const att of dynamicAttributes) {
        if (att.type === RegistrationAttributeTypes.boolean) {
          customData[att.name] =
            RegistrationsInputValidatorHelpers.stringToBoolean(
              record[att.name],
              false,
            );
        } else {
          customData[att.name] = record[att.name];
        }
      }

      const programFinancialServiceProviderConfiguration =
        await this.programFinancialServiceProviderConfigurationRepository.findOneOrFail(
          {
            where: {
              name: Equal(
                record.programFinancialServiceProviderConfigurationName,
              ),
              programId: Equal(program.id),
            },
          },
        );
      registration.programFinancialServiceProviderConfiguration =
        programFinancialServiceProviderConfiguration;
      registrations.push(registration);
      customDataList.push(customData);
    }

    // Save registrations using .save to properly set registrationProgramId
    const savedRegistrations: RegistrationEntity[] = [];
    for await (const registration of registrations) {
      const savedRegistration =
        await this.registrationUtilsService.save(registration);
      savedRegistrations.push(savedRegistration);
    }

    // Save registration status change events they changed from null to registered
    await this.eventsService.log(
      savedRegistrations.map((r) => ({
        id: r.id,
        status: undefined,
      })),
      savedRegistrations.map((r) => ({
        id: r.id,
        status: r.registrationStatus!,
      })),
      { registrationAttributes: ['status'] },
    );

    // Save registration data in bulk for performance
    const dynamicAttributeRelations =
      await this.programService.getAllRelationProgram(program.id);
    let registrationDataArrayAllPa: RegistrationAttributeDataEntity[] = [];
    for (const [i, registration] of savedRegistrations.entries()) {
      const registrationDataArray = this.prepareRegistrationData(
        registration,
        customDataList[i],
        dynamicAttributeRelations,
      );
      registrationDataArrayAllPa = registrationDataArrayAllPa.concat(
        registrationDataArray,
      );
      countImported += 1;
    }
    await this.registrationDataScopedRepository.save(
      registrationDataArrayAllPa,
      {
        chunk: 5000,
      },
    );

    // Store inclusion score and paymentAmountMultiplierFormula if it's relevant
    const programHasScore = await this.programHasInclusionScore(program.id);
    for await (const registration of savedRegistrations) {
      if (programHasScore) {
        await this.inclusionScoreService.calculateInclusionScore(
          registration.referenceId,
        );
      }
      if (program.paymentAmountMultiplierFormula) {
        await this.inclusionScoreService.calculatePaymentAmountMultiplier(
          program,
          registration.referenceId,
        );
      }
    }
    await this.actionService.saveAction(
      userId,
      program.id,
      AdditionalActionType.importRegistrations,
    );

    return { aggregateImportResult: { countImported } };
  }

  private async programHasInclusionScore(programId: number): Promise<boolean> {
    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: {
          programId: Equal(programId),
        },
      });
    for (const attribute of programRegistrationAttributes) {
      if (
        attribute.scoring != null &&
        JSON.stringify(attribute.scoring) !== '{}'
      ) {
        return true;
      }
    }
    return false;
  }

  private prepareRegistrationData(
    registration: RegistrationEntity,
    customData: object,
    dynamicAttributeRelations: RegistrationDataInfo[],
  ): RegistrationAttributeDataEntity[] {
    const registrationDataArray: RegistrationAttributeDataEntity[] = [];
    for (const att of dynamicAttributeRelations) {
      let values: unknown[] = [];
      if (att.type === RegistrationAttributeTypes.boolean) {
        values.push(
          RegistrationsInputValidatorHelpers.stringToBoolean(
            customData[att.name],
            false,
          ),
        );
      } else if (att.type === RegistrationAttributeTypes.text) {
        values.push(customData[att.name] ? customData[att.name] : '');
      } else if (att.type === RegistrationAttributeTypes.multiSelect) {
        values = customData[att.name].split('|');
      } else {
        values.push(customData[att.name]);
      }
      for (const value of values) {
        if (value != null) {
          const registrationData = new RegistrationAttributeDataEntity();
          registrationData.registration = registration;
          registrationData.value = value as string;
          registrationData.programRegistrationAttributeId =
            att.relation.programRegistrationAttributeId;
          registrationDataArray.push(registrationData);
        }
      }
    }
    return registrationDataArray;
  }

  private async csvToValidatedRegistrations(
    csvFile: Express.Multer.File,
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const maxRecords = 1000;
    const importRecords = await this.fileImportService.validateCsv(
      csvFile,
      maxRecords,
    );
    return await this.validateImportAsRegisteredInput(
      importRecords,
      programId,
      userId,
    );
  }

  private async getDynamicAttributes(
    programId: number,
  ): Promise<AttributeWithOptionalLabel[]> {
    const programRegistrationAttributes = (
      await this.programRegistrationAttributeRepository.find({
        where: { program: { id: Equal(programId) } },
      })
    ).map((attribute) => {
      return {
        id: attribute.id,
        name: attribute.name,
        type: attribute.type,
        options: attribute.options,
        isRequired: attribute.isRequired,
      } as AttributeWithOptionalLabel;
    });
    return programRegistrationAttributes;
  }

  public async validateImportAsRegisteredInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const { allowEmptyPhoneNumber } =
      await this.programService.findProgramOrThrow(programId);
    const validationConfig = new ValidationConfigDto({
      validatePhoneNumberEmpty: !allowEmptyPhoneNumber,
      validatePhoneNumberLookup: true,
      validateClassValidator: true,
      validateUniqueReferenceId: true,
      validateScope: true,
      validatePreferredLanguage: true,
    });
    const dynamicAttributes = await this.getDynamicAttributes(programId);
    return (await this.registrationsInputValidator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
      RegistrationCsvValidationEnum.importAsRegistered,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }

  private async validateBulkUpdateInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const { allowEmptyPhoneNumber } =
      await this.programService.findProgramOrThrow(programId);

    // Checking if there is any phoneNumber values in the submitted CSV file
    const hasPhoneNumber = csvArray.some((row) => row.phoneNumber);

    const validationConfig = new ValidationConfigDto({
      validateExistingReferenceId: false,
      // if there is no phoneNumber column in the submitted CSV file, but program is configured to not allow empty phone number
      // then we are considering, in database we already have phone numbers for registrations and we are not expecting to update phone number through mas update.
      // So ignoring phone number validation
      validatePhoneNumberEmpty: hasPhoneNumber && !allowEmptyPhoneNumber,
      validatePhoneNumberLookup: false,
      validateClassValidator: true,
      validateUniqueReferenceId: false,
      validateScope: true,
      validatePreferredLanguage: true,
    });

    const dynamicAttributes = await this.getDynamicAttributes(programId);

    return (await this.registrationsInputValidator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
      RegistrationCsvValidationEnum.bulkUpdate,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }
}
