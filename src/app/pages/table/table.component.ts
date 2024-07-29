import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
  router = inject(Router);
  route = inject(ActivatedRoute);
  displayedColumns: (keyof GithubIssue)[] = [
    'created_at',
    'updated_at',
    'title',
  ];

  _pageSize = toSignal(
    this.route.queryParamMap.pipe(
      map((queryParamMap) => {
        const pageSize = queryParamMap.get('pageSize');
        return pageSize ? +pageSize : 100;
      }),
    ),
  );
  pageSize = computed<number>(() => this._pageSize() ?? 100);

  _page = toSignal<number>(
    this.route.queryParamMap.pipe(
      map((queryParamMap) => {
        const page = queryParamMap.get('page');
        return page ? +page : 1;
      }),
    ),
  );
  page = computed(() => this._page() ?? 1);

  _sort = toSignal(
    this.route.queryParamMap.pipe(
      map((queryParamMap) => queryParamMap.get('sort')),
    ),
  );
  sort = computed(() => this._sort() ?? 'created_at');

  _sortOrder = toSignal<SortDirection>(
    this.route.queryParamMap.pipe(
      map((queryParamMap) => queryParamMap.get('sortOrder') as SortDirection),
    ),
  );
  sortOrder = computed(() => this._sortOrder() ?? 'desc');

  totalCount = signal<number>(0);
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
    const page = $event.pageIndex + 1;
    const pageSize = $event.pageSize;
    this.router.navigate([], {
      queryParams: { page, pageSize },
      queryParamsHandling: 'merge',
    });
  }

  onSortChanged($event: Sort) {
    const sort = $event.active;
    const sortOrder = $event.direction;
    this.router.navigate([], {
      queryParams: { sort, sortOrder },
      queryParamsHandling: 'merge',
    });
  }
}
