import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ImportFspReconciliationArrayDto } from '@121-service/src/payments/dto/import-fsp-reconciliation.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { WrapperType } from '@121-service/src/wrapper.type';

export enum ImportStatus {
  imported = 'imported',
  notFound = 'notFound',
  paymentSuccess = 'paymentSuccess',
  paymentFailed = 'paymentFailed',
}

const fspArray = Object.values(FinancialServiceProviders).map((item) =>
  String(item),
);
const languageArray = Object.values(LanguageEnum).map((item) => String(item));
export class BulkImportDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public phoneNumber?: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public paymentAmountMultiplier?: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public maxPayments?: number;

  @ApiProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsEnum(LanguageEnum)
  @IsOptional()
  public preferredLanguage?: WrapperType<LanguageEnum>;

  @ApiProperty({ example: 'utrecht.houten' })
  @IsString()
  @IsOptional()
  public scope?: string;
}

export class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
  public registrationStatus: RegistrationStatusEnum | string;
}

class ImportFspReconciliationResult extends ImportFspReconciliationArrayDto {
  public importStatus: ImportStatus;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
  public uploadFspReconciliationResult?: ImportFspReconciliationResult[];
}

class AggregateImportResult {
  public countImported?: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
  public countNotFound?: number;
  public countPaymentSuccess?: number;
  public countPaymentFailed?: number;
}
export class ImportRegistrationsDto extends BulkImportDto {
  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  // Should we change this to a more specific name?
  // It could also be programFinancialServiceProviderConfigurationName (which is a good name for us programmers)
  // However this name is also used by users in the csv file, so it should be a name that is understandable for them
  public programFinancialServiceProviderConfigurationName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(5, 200)
  public referenceId?: string;

  @ApiProperty()
  @IsOptional()
  public declare scope?: string;
}
