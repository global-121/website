import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export class PaginationFilter {
  value: string;
  name: string;
  operator?: FilterOperatorEnum;
}

export enum FilterOperatorEnum {
  eq = '$eq',
  in = '$in',
  ilike = '$ilike',
  null = '$null',
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private DEFAULT_TEXT_FILTER = [];
  private textFilterSubject = new BehaviorSubject<PaginationFilter[]>(
    this.DEFAULT_TEXT_FILTER,
  );
  private textFilter: PaginationFilter[];

  constructor() {
    this.textFilter = this.DEFAULT_TEXT_FILTER;
  }

  public addTextFilter(column: string, value: string) {
    this.textFilter.push({ name: column, value });
    this.textFilterSubject.next(this.textFilter);
  }

  public removeTextFilter(column: string) {
    this.textFilter = this.textFilter.filter((f) => f.name !== column);
    this.textFilterSubject.next(this.textFilter);
  }

  public getTextFilterSubscription(): Observable<PaginationFilter[]> {
    return this.textFilterSubject.asObservable();
  }
}
