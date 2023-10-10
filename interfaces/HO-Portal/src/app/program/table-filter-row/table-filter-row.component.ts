import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import RegistrationStatus from 'src/app/enums/registration-status.enum';
import { ProgramPhase } from '../../models/program.model';
import { TableFilterType } from '../../models/table-filter.model';
import { FilterService, PaginationFilter } from '../../services/filter.service';

@Component({
  selector: 'app-table-filter-row',
  templateUrl: './table-filter-row.component.html',
  styleUrls: ['./table-filter-row.component.scss'],
})
export class TableFilterRowComponent implements OnInit {
  @Input()
  public isLoading: boolean;

  @Input()
  public allFilters: { name: string; label: string }[] = [];

  @Input()
  public thisPhase: ProgramPhase;

  @Input()
  public programId: number;

  public textFilterOption: { name: string; label: string }[] = [];

  public textFilter: Observable<PaginationFilter[]>;

  public filterRowsVisibleQuery: string;

  public tableFilterType = TableFilterType;

  public allPaStatuses = Object.values(RegistrationStatus);

  constructor(private filterService: FilterService) {}

  public ngOnInit(): void {
    this.textFilter = this.filterService.getTextFilterSubscription();
  }

  public applyFilter() {
    if (!this.textFilterOption.length) {
      return;
    }
    if (this.disableApplyButton()) {
      return;
    }
    this.filterService.addTextFilter(
      this.textFilterOption[0].name,
      this.textFilterOption[0].label,
      this.filterRowsVisibleQuery,
    );
    this.clearFilterCreateForm();
  }

  private clearFilterCreateForm() {
    this.filterRowsVisibleQuery = '';
    this.textFilterOption = [];
  }

  public removeTextFilter(column: string) {
    this.filterService.removeTextFilter(column);
  }

  public showInput(): boolean {
    if (!this.textFilterOption.length) {
      return false;
    }

    return true;
  }

  public disableApplyButton(): boolean {
    if (
      !this.filterRowsVisibleQuery ||
      this.filterRowsVisibleQuery.trim() === ''
    ) {
      return true;
    }

    return false;
  }

  public clearAllFilters() {
    this.filterService.clearAllFilters();
  }
}
