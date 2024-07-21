import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { OverlayModule } from '@angular/cdk/overlay';
import { GithubApiService } from '../../core/services/github-api.service';
import {
  catchError,
  combineLatest,
  debounceTime,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { GithubIssue } from '../../core/models/github-issue';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { GitHubOrderKey } from '../../core/models/github-order-key';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    OverlayModule,
    AsyncPipe,
    MatProgressSpinner,
    MatSortModule,
    DatePipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  githubApiService = inject(GithubApiService);
  displayedColumns: (keyof GithubIssue)[] = [
    'created_at',
    'updated_at',
    'title',
  ];
  pageSize = signal<number>(100);
  page = signal<number>(1);
  totalCount = signal<number>(0);
  sort = signal<keyof GithubIssue>('created_at');
  sortOrder = signal<SortDirection>('desc');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  data$: Observable<GithubIssue[]> = combineLatest({
    sort: toObservable(this.sort),
    sortOrder: toObservable(this.sortOrder),
    page: toObservable(this.page),
    pageSize: toObservable(this.pageSize),
  }).pipe(
    tap(() => this.isLoading.set(true)),
    debounceTime(0), // to prevent multiple requests when parameters are changed at the same time
    switchMap(({ sort, sortOrder, page, pageSize }) => {
      let sortBy: GitHubOrderKey;
      switch (sort) {
        case 'created_at':
          sortBy = 'created';
          break;
        case 'updated_at':
          sortBy = 'updated';
          break;
        default:
          sortBy = 'created';
      }
      return this.githubApiService.getRepoIssues(
        sortBy,
        sortOrder,
        page,
        pageSize,
      );
    }),
    tap((response) => this.totalCount.set(response.total_count)),
    tap(() => this.isLoading.set(false)),
    map((response) => response.items),
    catchError((err: HttpErrorResponse) => {
      this.error.set(err.error.message);
      this.isLoading.set(false);
      return of([]);
    }),
  );

  onPageChanged($event: PageEvent) {
    this.page.set($event.pageIndex + 1);
    this.pageSize.set($event.pageSize);
  }

  onSortChanged($event: Sort) {
    this.sort.set($event.active as keyof GithubIssue);
    this.sortOrder.set($event.direction);
  }
}
