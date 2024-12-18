import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Locator, Page } from 'playwright';
import * as XLSX from 'xlsx';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';

class PaymentsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly createPaymentButton: Locator;
  readonly addToPaymentButton: Locator;
  readonly fspSummary: Locator;
  readonly startPaymentButton: Locator;
  readonly paymentTitle: Locator;
  readonly paymentSummaryMetrics: Locator;
  readonly paymentSummaryWithInstructions: Locator;
  readonly exportFspPaymentListButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.createPaymentButton = this.page.getByRole('button', {
      name: 'Create new payment',
    });
    this.addToPaymentButton = this.page.getByRole('button', {
      name: 'Add to payment',
    });
    this.startPaymentButton = this.page.getByRole('button', { name: 'Start' });
    this.fspSummary = this.page
      .locator('p-card')
      .filter({ hasText: 'Financial Service Provider(s' });
    this.paymentTitle = this.page.getByRole('link', { name: 'Payment' });
    this.paymentSummaryMetrics = this.page
      .getByTestId('payment-summary-metrics')
      .locator('app-metric-container');
    this.paymentSummaryWithInstructions = this.page.getByTestId(
      'create-payment-excel-fsp-instructions',
    );
    this.exportFspPaymentListButton = this.page.getByRole('button', {
      name: 'Export FSP payment list',
    });
  }

  async selectAllRegistrations() {
    await this.table.selectAllCheckbox();
  }

  async validatePaymentSummary({
    fsp,
    registrationsNumber,
    currency,
    paymentAmount,
  }: {
    fsp: string[];
    registrationsNumber: number;
    currency: string;
    paymentAmount: number;
  }) {
    const fspSummary = await this.fspSummary.textContent();

    expect(fspSummary).toContain(
      `Financial Service Provider(s): ${fsp.join(', ')}`,
    );
    expect(fspSummary).toContain(`Registrations: ${registrationsNumber}`);
    expect(fspSummary).toContain(
      `Total payment amount: ${currency}${paymentAmount}`,
    );
  }

  async createPayment() {
    await this.createPaymentButton.click();
    await this.selectAllRegistrations();
    await this.addToPaymentButton.click();
  }

  async startPayment() {
    await this.startPaymentButton.click();
  }

  async waitForPaymentToComplete() {
    const inProgressChip = this.page
      .locator('app-colored-chip')
      .getByLabel('In progress');

    await inProgressChip.waitFor({ state: 'hidden' });
  }

  async validatePaymentCard({
    date,
    registrationsNumber,
    paymentAmount,
    successfulTransfers,
    failedTransfers,
  }: {
    date: string;
    registrationsNumber: number;
    paymentAmount: number;
    successfulTransfers: number;
    failedTransfers: number;
  }) {
    const paymentTitle = await this.paymentTitle.textContent();
    const includedRegistrationsElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Included reg.' })
      .textContent();
    const totalAmountElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Total amount' })
      .textContent();
    const successfulTransfersElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Successful transfers' })
      .textContent();
    const failedTransfersElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Failed transfers' })
      .textContent();

    expect(paymentTitle).toContain(date);
    expect(includedRegistrationsElement).toContain(
      registrationsNumber.toString(),
    );
    expect(totalAmountElement).toContain(paymentAmount.toString());
    expect(successfulTransfersElement).toContain(
      successfulTransfers.toString(),
    );
    expect(failedTransfersElement).toContain(failedTransfers.toString());
  }

  async openPaymentByDate({ date }: { date: string }) {
    const paymentTitle = this.page.getByText(date);
    await paymentTitle.click();
  }

  async validateExcelFspInstructions() {
    const paymentSummaryWithInstructions =
      await this.paymentSummaryWithInstructions.textContent();

    if (!paymentSummaryWithInstructions) {
      throw new Error('Payment summary with instructions is not available.');
    }

    const expectedText = `
      Review payment summary and follow the next steps: Click start payment, this will direct you to the payment page.
      Export the FSP instructions from the payment page. This is only possible once the payment is no longer in progress.
      Save the exported XLSX-file in the format required by the Financial Service Provider.
      Upload the file to the Financial Service Provider’s portal.
    `
      .replace(/\s+/g, ' ')
      .trim();

    const actualText = paymentSummaryWithInstructions
      .replace(/\s+/g, ' ')
      .replace(/Financial Service Provider\(s\):.*/g, '')
      .trim();

    if (actualText !== expectedText) {
      throw new Error(
        `Expected payment summary instructions to be:\n${expectedText}\n\nBut received:\n${actualText}`,
      );
    }
  }

  async downloadPaymentInstructions() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportFspPaymentListButton.click(),
    ]);

    const downloadDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<
      string,
      unknown
    >[];
    console.log(data);

    if (data.length === 0) throw new Error('No data found in the sheet');
  }
}

export default PaymentsPage;
