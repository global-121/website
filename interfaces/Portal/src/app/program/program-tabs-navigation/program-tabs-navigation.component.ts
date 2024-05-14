import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  selector: 'app-program-tabs-navigation',
  templateUrl: './program-tabs-navigation.component.html',
  styleUrls: ['./program-tabs-navigation.component.scss'],
})
export class ProgramTabsNavigationComponent implements OnInit {
  @Input()
  public programId: number;

  public dashboardIsEnabled: boolean;

  public programPhases: Phase[];

  constructor(
    private authService: AuthService,
    private programPhaseService: ProgramPhaseService,
    private programsService: ProgramsServiceApiService,
  ) {}

  public async ngOnInit() {
    const program = await this.programsService.getProgramById(this.programId);
    const programPhases: Phase[] = await this.programPhaseService.getPhases();

    const canReadAidWorkers = await this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramREAD,
    );

    const dashboardIsEnabled = !!program?.monitoringDashboardUrl;
    const canViewMetrics = await this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );

    this.programPhases = programPhases.map((item: Phase) => {
      if (item.name === ProgramPhase.team) {
        item.disabled = !canReadAidWorkers;
      }

      if (item.name === ProgramPhase.monitoring) {
        item.disabled = !canViewMetrics && dashboardIsEnabled;
      }

      return item;
    });
  }
}
