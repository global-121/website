import { Base121Entity } from '@121-service/src/base.entity';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('event_attribute')
export class EventAttributeEntity extends Base121Entity {
  @ManyToOne((_type) => EventEntity, (event) => event.attributes)
  @JoinColumn({ name: 'eventId' })
  public event: EventEntity;
  @Column()
  public eventId: number;

  @Index()
  @Column()
  public key: EventAttributeKeyEnum;

  @Column({ nullable: true })
  public value: string | null;
}
