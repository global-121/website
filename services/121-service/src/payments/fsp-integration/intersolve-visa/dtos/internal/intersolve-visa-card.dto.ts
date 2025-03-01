import { ApiProperty } from '@nestjs/swagger';

import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export class IntersolveVisaCardDto {
  @ApiProperty({ example: '123456' })
  public tokenCode: string;

  @ApiProperty({
    enum: VisaCard121Status,
    example: VisaCard121Status.Issued,
  })
  public status: WrapperType<VisaCard121Status>;

  @ApiProperty({ example: 'Card issued' })
  public explanation: string;

  @ApiProperty({ example: '2022-01-01T00:00:00Z' })
  public issuedDate: Date;

  @ApiProperty()
  public actions: WrapperType<VisaCardAction[]>;

  @ApiProperty()
  public debugInformation: WrapperType<IntersolveVisaCardDebugInformation>;
}

class IntersolveVisaCardDebugInformation {
  @ApiProperty({ example: IntersolveVisaCardStatus.CardOk })
  public intersolveVisaCardStatus: WrapperType<IntersolveVisaCardStatus | null>;
  @ApiProperty({ example: IntersolveVisaTokenStatus.Active })
  public intersolveVisaTokenStatus: WrapperType<IntersolveVisaTokenStatus>;
  @ApiProperty({ example: true })
  public isTokenBlocked: boolean;
}
