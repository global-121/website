import { HttpStatus } from '@nestjs/common';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '../helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  referenceId1PV,
  registration1PV,
  registration2PV,
} from './pagination/pagination-data';

describe('Import a registration', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
  });

  it('should import registrations', async () => {
    // Arrange
    accessToken = await getAccessToken();

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programIdOCW,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationVisa) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration['financialServiceProvider']).toBe(
          registrationVisa[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration[key]).toBe(registrationVisa[key]);
      }
    }
  });

  it('should import registration scoped', async () => {
    // Arrange
    const accessToken = await getAccessTokenScoped(DebugScope.Zeeland);

    // Act
    const response = await importRegistrations(
      programIdPV,
      [registration1PV],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      referenceId1PV,
      programIdPV,
      accessToken,
    );
    const registrationResult = result.body.data[0];

    for (const key in registrationVisa) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registrationResult['financialServiceProvider']).toBe(
          registration1PV[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registrationResult[key]).toBe(registration1PV[key]);
      }
    }
  });

  it('should not import any registration if one of them has different scope than user', async () => {
    // Arrange
    const accessToken = await getAccessTokenScoped(DebugScope.Zeeland);

    // Act
    const response = await importRegistrations(
      programIdPV,
      [registration1PV, registration2PV],
      accessToken,
    );

    // Assert
    console.log('response.statusCode: ', response.statusCode);
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      referenceId1PV,
      programIdPV,
      accessToken,
    );
    const registrationsResult = result.body.data;
    console.log('registrationsResult: ', registrationsResult);
    expect(registrationsResult).toHaveLength(0);
  });
});
