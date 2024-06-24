import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../../121-platform/interfaces/Portal/src/assets/i18n/en.json';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import Helpers from '../../../pages/Helpers/Helpers';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27495] View Activity Overview on PA profile page', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await table.clickOnPaNumber(1);
  });

  await test.step('Validate the "Status history" tab on the PA Activity Overview table', async () => {
    const userName =
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? 'defaultUserName';

    await registration.validateHeaderToContainText(
      englishTranslations['registration-details'].pageTitle,
    );
    await registration.openActivityOverviewTab('Status history');
    await registration.validateChangeLogTile(
      englishTranslations['registration-details']['activity-overview']
        .activities.status.label,
      userName,
      await Helpers.getTodaysDate(),
      englishTranslations['registration-details']['activity-overview']
        .activities['data-changes'].old,
      englishTranslations['registration-details']['activity-overview']
        .activities['data-changes'].new,
    );
  });
});
