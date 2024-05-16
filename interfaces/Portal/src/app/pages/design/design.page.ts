import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramTab } from 'src/app/models/program.model';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
})
export class DesignPage {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramTab.overview;

  constructor(private route: ActivatedRoute) {}
}
