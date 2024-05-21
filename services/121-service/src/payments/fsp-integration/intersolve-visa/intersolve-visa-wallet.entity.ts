import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-customer.entity';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

export enum IntersolveVisaWalletStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Redeemed = 'REDEEMED',
  Substituted = 'SUBSTITUTED',
  Expired = 'EXPIRED',
  Disabled = 'DISABLED',
}

export enum IntersolveVisaCardStatus {
  CardOk = 'CARD_OK',
  CardBlocked = 'CARD_BLOCKED',
  SuspectedFraud = 'SUSPECTED_FRAUD',
  CardClosedDueToFraud = 'CARD_CLOSED_DUE_TO_FRAUD',
  CardNoRenewal = 'CARD_NO_RENEWAL',
  CardStolen = 'CARD_STOLEN',
  CardLost = 'CARD_LOST',
  CardClosed = 'CARD_CLOSED',
  CardExpired = 'CARD_EXPIRED',
}

@Entity('intersolve_visa_wallet')
export class IntersolveVisaWalletEntity extends Base121Entity {
  @Index()
  @Column({ unique: true, nullable: true })
  public tokenCode: string | null;

  @Column({ nullable: true })
  public tokenBlocked: boolean | null;

  @Column({ default: false })
  public linkedToVisaCustomer: boolean;

  @Column({ default: false })
  public debitCardCreated: boolean;

  @Column({ nullable: true })
  public balance: number | null;

  @Column({ nullable: true })
  public walletStatus: IntersolveVisaWalletStatus | null;

  @Column({ nullable: true })
  public cardStatus: IntersolveVisaCardStatus | null;

  @Column({ nullable: true })
  public lastUsedDate: Date | null;

  // Last time we got an update from Intersolve about the wallet status or balance or when it was last used
  @Column({ nullable: true })
  public lastExternalUpdate: Date | null;

  // This is euro cents
  @Column({ default: 0 })
  public spentThisMonth: number;

  @ManyToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaWallets,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;

  public calculateTopUpAmount(): number {
    return (
      (maximumAmountOfSpentCentPerMonth - this.spentThisMonth - this.balance) /
      100
    );
  }
}
