import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPvExcel } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import PaymentsPage from '@121-e2e/portalicious/pages/PaymentsPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

// Export Excel FSP payment list
const amount = 17.5;
const fullName = 'Gemma Houtenbos';
const addressStreet = 'Teststraat';
const addressHouseNumber = '1';
const addressPostalCode = '1234AB';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const PVProgramId = programIdPV;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsPvExcel,
    PVProgramId,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[31972] Do payment for excel fsp', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const registrationsPage = new RegistrationsPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;
  const numberOfPas = registrationsPvExcel.length;
  const defaultTransferValue = NLRCProgramPV.fixedTransferValue;
  const defaultMaxTransferValue = registrationsPvExcel.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const financialServiceProviders: string[] = ['Excel Payment Instructions'];

  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.validateExcelFspInstructions();
  });

  await test.step('Do payment', async () => {
    await paymentsPage.validatePaymentSummary({
      fsp: financialServiceProviders,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
    await paymentsPage.startPayment();
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Download payment instructions', async () => {
    await paymentsPage.openPaymentByDate({ date: lastPaymentDate });
    await paymentsPage.selectPaymentExportOption({
      option: 'Export FSP payment list',
    });
    await registrationsPage.exportAndAssertExcelFspList(
      0,
      {
        amount,
        fullName,
        addressStreet,
        addressHouseNumber,
        addressPostalCode,
      },
      { condition: true, rowCount: 4 },
    );
  });
});
