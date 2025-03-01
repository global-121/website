import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28446] OCW: Show maximum total amount (Dry Run)', async ({ page }) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const paymentsPage = new PaymentsPage(page);

  const PaymentNumber = 1;
  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await tableModule.doPayment(PaymentNumber);
    await paymentsPage.verifyPaymentPopupValues({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue,
    });
  });
});
