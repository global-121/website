import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import helpMock from 'src/app/mocks/help.mock';
import { Help } from 'src/app/models/help.model';
import { HelpService } from 'src/app/services/help.service';
import { LoggingService } from 'src/app/services/logging.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
})
export class HelpPage {
  public help: Help = helpMock;

  constructor(
    public modalController: ModalController,
    public helpService: HelpService,
    public translatableString: TranslatableStringService,
    private loggingService: LoggingService,
  ) {
    this.loadHelpDetails();
  }

  loadHelpDetails() {
    this.helpService.getHelp().then((help) => {
      this.help = this.translateHelpDetails(help);
    });
  }

  translateHelpDetails(help: Help): Help {
    help.helpText = this.translatableString.get(help.helpText);
    help.helpPhoneLabel = this.translatableString.get(help.helpPhoneLabel);
    return help;
  }

  dismiss() {
    this.loggingService.logEvent('referral-help-page-close');
    this.modalController.dismiss({
      dismissed: true,
    });
  }

  public logClick(name) {
    this.loggingService.logEvent('referral-help-click', { name });
  }
}
