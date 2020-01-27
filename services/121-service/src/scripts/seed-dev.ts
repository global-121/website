import { SeedHelper } from './seed-helper';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';

import { AppointmentEntity } from '../schedule/appointment/appointment.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { CountryEntity } from '../programs/country/country.entity';
import { CredentialAttributesEntity } from '../sovrin/credential/credential-attributes.entity';
import { UserEntity } from '../user/user.entity';
import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

import { SeedInit } from './seed-init';

import programBasicExample from '../../examples/program-basic.json';
import programAnonymousExample from '../../examples/program-anonymous1.json';
import SeedPublish from './seed-publish';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';

const EXAMPLE_DID = 'did:sov:1wJPyULfLLnYTEFYzByfUR';

@Injectable()
export class SeedDev implements InterfaceScript {
  public constructor(private connection: Connection) { }

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Country A' }]);
    await countryRepository.save([{ country: 'Country B' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    const financialServiceProviderRepository = this.connection.getRepository(FinancialServiceProviderEntity);
    await financialServiceProviderRepository.save([{ fsp: 'Bank A' }]);
    await financialServiceProviderRepository.save([{ fsp: 'Mobile Money Provider B' }]);

    // ***** CREATE PROTECTION SERVICE PROVIDERS *****
    const protectionServiceProviderRepository = this.connection.getRepository(ProtectionServiceProviderEntity);
    await protectionServiceProviderRepository.save([{ psp: 'Protection Service Provider A' }]);
    await protectionServiceProviderRepository.save([{ psp: 'Protection Service Provider B' }]);

    // ***** CREATE A CONNECTION *****
    const connectionRepository = this.connection.getRepository(
      ConnectionEntity,
    );
    await connectionRepository.save([
      {
        did: EXAMPLE_DID,
        phoneNumber: '0031600000000',
        programsEnrolled: [1],
        programsIncluded: [1],
        programsExcluded: [],
      },
    ]);

    // ***** CREATE A PROGRAM WITH CUSTOM CRITERIA *****
    const userRepository = this.connection.getRepository(UserEntity);

    const examplePrograms = [
      programAnonymousExample,
      programBasicExample,
    ];

    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** ASSIGN AIDWORKER TO PROGRAM *****

    await this.seedHelper.assignAidworker(2, 1);
    await this.seedHelper.assignAidworker(2, 2);


    // ***** CREATE APPOINTMENT *****
    const appointmentRepository = this.connection.getRepository(
      AppointmentEntity,
    );

    const appointment = new AppointmentEntity();
    appointment.timeslotId = 1;
    appointment.did = EXAMPLE_DID;
    appointment.status = 'waiting'
    await appointmentRepository.save(appointment);

    // ***** CREATE PREFILLED ANSWERS *****
    const credentialAttributesRepository = this.connection.getRepository(
      CredentialAttributesEntity,
    );

    let credential1 = new CredentialAttributesEntity();
    credential1.did = EXAMPLE_DID;
    credential1.programId = 1;
    credential1.attributeId = 1;
    credential1.attribute = 'nr_of_children';
    credential1.answer = '2';
    await credentialAttributesRepository.save(credential1);

    let credential2 = new CredentialAttributesEntity();
    credential2.did = EXAMPLE_DID;
    credential2.programId = 1;
    credential2.attributeId = 2;
    credential2.attribute = 'roof_type';
    credential2.answer = '0';
    await credentialAttributesRepository.save(credential2);

    await this.seedPublish.run();
    await this.connection.close();
  }
}

export default SeedDev;
