import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { doPaymentForAllPAs } from '@121-service/test/helpers/program.helper';
import {
  bulkUpdateRegistrationsCSV,
  importRegistrationsCSV,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcPVProgrammeTitle = NLRCProgramPV.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const includeLable =
  englishTranslations.page.program['program-people-affected'].actions.include;
const peopleAffectedLabel =
  englishTranslations.page.program.tab['people-affected'].label;
const ok = englishTranslations.common.ok;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();

  await importRegistrationsCSV(
    programIdPV,
    './test-registration-data/test-registrations-PV.csv',
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28468] PV: Retry payment for all failed payments of PAs', async ({
  page,
}) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = 20;
  const defaultTransferValue = NLRCProgramPV.fixedTransferValue;

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcPVProgrammeTitle);
    await navigationModule.navigateToProgramTab(peopleAffectedLabel);
  });

  await test.step('Include registrations', async () => {
    await tableModule.applyBulkAction({
      label: includeLable,
    });
    await tableModule.acceptBulkAction();
  });

  await test.step('Make first failed payment', async () => {
    const accessToken = await getAccessToken();

    await navigationModule.navigateToProgramTab(paymentLabel);
    await doPaymentForAllPAs({
      programId: programIdPV,
      paymentNr: 1,
      amount: defaultTransferValue,
      accessToken,
    });
    await page.reload();
    await paymentsPage.validatePaymentStatus({});
    await paymentsPage.validateFailedPaymentStatus({ payments: 4 });
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await bulkUpdateRegistrationsCSV(
      programIdPV,
      './test-registration-data/test-registrations-patch-PV.csv',
      accessToken,
      'Bulk update for test registrations due to data validation improvements',
    );
    await paymentsPage.retryPayment({
      buttonName: ok,
    });
    await paymentsPage.validateSuccessfulPaymentStatus({
      payments: numberOfPas,
    });
  });
});
