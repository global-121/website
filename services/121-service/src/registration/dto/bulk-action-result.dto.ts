import { ApiProperty } from '@nestjs/swagger';
import { FinancialServiceProviderName } from '../../financial-service-providers/enum/financial-service-provider-name.enum';

export class BulkActionResultDto {
  @ApiProperty({
    example: 10,
  })
  public readonly totalFilterCount: number;

  @ApiProperty({ example: 8 })
  public readonly applicableCount: number;

  @ApiProperty({ example: 2 })
  public readonly nonApplicableCount: number;
}

export class BulkActionResultPaymentDto extends BulkActionResultDto {
  @ApiProperty({ example: 9 })
  public readonly sumPaymentAmountMultiplier: number;
  @ApiProperty({ example: [FinancialServiceProviderName.intersolveVisa, FinancialServiceProviderName.excel] })
  public readonly fspsInPayment: string[];
}
