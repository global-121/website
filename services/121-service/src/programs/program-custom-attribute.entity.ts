import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { CustomAttributeType } from '@121-service/src/programs/dto/create-program-custom-attribute.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { ProgramPhase } from 'src/shared/enum/program-phase.enum';
import {
  BeforeRemove,
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Unique('programCustomAttributeUnique', ['name', 'programId'])
@Entity('program_custom_attribute')
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
export class ProgramCustomAttributeEntity extends CascadeDeleteEntity {
  @Column()
  public name: string;

  @Column()
  public type: CustomAttributeType;

  @Column('json')
  public label: LocalizedString;

  @Column('json', { default: [] })
  public phases: ProgramPhase[];

  @Column({ default: false })
  public duplicateCheck: boolean;

  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programCustomAttributes,
  )
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;

  @Column()
  public programId: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programCustomAttribute,
  )
  public registrationData: RegistrationDataEntity[];

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationDataEntity,
        columnName: 'programCustomAttributeId',
      },
    ]);
  }
}
