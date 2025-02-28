import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { changeBulkRegistrationStatus } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';

import { Components, Pages } from '../../../helpers/interfaces';

const toastMessageIncluded =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';

export default (pages: Partial<Pages>, components: Partial<Components>) => {
  test('[31209] Move PA(s) from status "Validated" to "Included"', async () => {
    const accessToken = await getAccessToken();
    const { basePage, registrations } = pages;
    const { tableComponent } = components;

    if (!basePage || !registrations || !tableComponent) {
      throw new Error('pages and components not found');
    }

    await test.step('Change status of all registrations to "Validated"', async () => {
      await changeBulkRegistrationStatus({
        programId: 2,
        status: RegistrationStatusEnum.validated,
        accessToken,
      });
    });

    await test.step('Search for the registration with status "Validated"', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Validated',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Validated',
      });
    });

    await test.step('Change status of first selected registration to "Validated"', async () => {
      await tableComponent.changeStatusOfRegistrationInTable({
        status: 'Include',
      });
      await basePage.validateToastMessage(toastMessageIncluded);
    });

    await test.step('Search for the registration with status "Validated"', async () => {
      await tableComponent.clearAllFilters();
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Included',
      });
    });

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });
  });
};
