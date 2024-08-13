import { PrimeDropdown } from '@121-e2e/portalicious/primeng-components/PrimeDropdown';
import { Locator, Page } from 'playwright';

class BasePage {
  readonly page: Page;
  readonly languageDropdown: PrimeDropdown;
  readonly projectHeader: Locator;
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly accountDropdown: Locator;
  readonly changePassword: PrimeDropdown;

  constructor(page: Page) {
    this.page = page;

    this.languageDropdown = new PrimeDropdown({
      page,
      testId: 'language-dropdown',
    });
    this.projectHeader = this.page.getByTestId('project-header');
    this.sidebar = this.page.getByTestId('sidebar');
    this.sidebarToggle = this.page.getByTestId('sidebar-toggle');
    this.accountDropdown = this.page.getByTestId('header-account-dropdown');
    this.changePassword = new PrimeDropdown({
      page,
      testId: 'header-change-password',
    });
  }

  async openSidebar() {
    await this.sidebarToggle.click();
  }

  async navigateToPage(pageName: string) {
    await this.openSidebar();
    await this.sidebar.getByRole('link', { name: pageName }).click();
  }

  async navigateToProgramPage(pageName: string) {
    await this.projectHeader.getByRole('menuitem', { name: pageName }).click();
  }

  async changeLanguage(language: string) {
    await this.openSidebar();
    await this.languageDropdown.selectOption({ label: language });
  }

  async openAccountDropdown() {
    await this.accountDropdown.click();
  }

  async selectAccountOption(option: string) {
    await this.openAccountDropdown();
    await this.changePassword.selectMenuItem({ label: option });
  }
}

export default BasePage;
