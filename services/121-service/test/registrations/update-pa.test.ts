import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  updatePaAttribute,
  updateRegisrationPatch,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { referenceIdVisa, registrationVisa } from '../visa-card/visa-card.data';

describe('Update attribute of PA', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  it('should not update unknown registration  ** /attribute', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';
    const updatePhoneNumber = '15005550099';

    // Act
    const response = await updatePaAttribute(
      programId,
      wrongReferenceId,
      'phoneNumber',
      updatePhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should succesfully update  ** /attribute', async () => {
    // Arrange
    const updatePhoneNumber = '15005550099';

    // Act
    const response = await updatePaAttribute(
      programId,
      referenceIdVisa,
      'phoneNumber',
      updatePhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    const registration = result.body[0];
    expect(registration.phoneNumber).toBe(updatePhoneNumber);
  });

  it('should not update unknown registration  ** patch', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';
    const updatePhoneNumber = '15005550099';
    const data = {
      phoneNumber: updatePhoneNumber,
    };

    const reason = 'automated test';

    // Act
    const response = await updateRegisrationPatch(
      programId,
      wrongReferenceId,
      data,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should succesfully update  ** patch', async () => {
    // Arrange
    const updatePhoneNumber = '15005550099';

    const data = {
      phoneNumber: updatePhoneNumber,
      firstName: 'Jane',
    };

    const reason = 'automated test';

    // Act
    const response = await updateRegisrationPatch(
      programId,
      referenceIdVisa,
      data,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    const registration = result.body[0];
    expect(registration.phoneNumber).toBe(updatePhoneNumber);
    expect(registration.firstName).toBe(data.firstName);
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });

  it('should fail on wrong phonenumber ** patch', async () => {
    // Arrange
    const updatePhoneNumber = '150';
    const data = {
      firstName: 'Jane',
      phoneNumber: updatePhoneNumber,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegisrationPatch(
      programId,
      referenceIdVisa,
      data,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    const registration = result.body[0];

    // Is old data still the same?
    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
    expect(registration.firstName).toBe(registrationVisa.firstName);
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });
});
