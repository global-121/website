import { Locator, Page } from 'playwright';
import BasePage from './BasePage';

class ChangePasswordPage extends BasePage {
  page: Page;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly changePasswordButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.currentPassword = this.page.getByTestId('current-password');
    this.newPassword = this.page.getByTestId('new-password');
    this.confirmPassword = this.page.getByTestId('confirm-password');
    this.changePasswordButton = this.page.getByRole('button', {
      name: 'Change password',
    });
  }

  async fillInChangePassword({
    currentPassword = '',
    newPassword,
    confirmPassword,
  }: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await this.currentPassword.fill(currentPassword);
    await this.newPassword.fill(newPassword);
    await this.confirmPassword.fill(confirmPassword);
  }

  async submitChangePassword() {
    await this.changePasswordButton.click();
  }

  async assertChangePasswordSuccessPopUp() {
    const popUp = this.page.getByRole('alertdialog');

    await popUp.isVisible();
    await popUp.isHidden();
  }
}

export default ChangePasswordPage;
