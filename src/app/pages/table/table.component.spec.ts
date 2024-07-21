import {
  TestBed,
  ComponentFixture,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TableComponent } from './table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GithubApiService } from '../../core/services/github-api.service';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GithubIssuesResponse } from '../../core/models/github-issues-response';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { GithubIssue } from '../../core/models/github-issue';
import { provideRouter } from '@angular/router';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let githubApiService: GithubApiService;

  const mockResponse: GithubIssuesResponse = {
    total_count: 1,
    incomplete_results: false,
    items: [
      {
        id: 1,
        title: 'Mock Issue',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-01T00:00:00Z',
        body: 'This is a mock issue.',
      } as GithubIssue,
    ],
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NoopAnimationsModule, TableComponent],
      providers: [
        {
          provide: GithubApiService,
          useValue: {
            getRepoIssues: () => {
              return of(mockResponse);
            },
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    githubApiService = TestBed.inject(GithubApiService);
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load data and display in the table', fakeAsync(() => {
    fixture.detectChanges(); // Trigger initial data load
    tick();

    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(
      By.css('tr.mdc-data-table__row'),
    );
    expect(rows.length).toBe(1);
    expect(rows[0].nativeElement.textContent).toContain('Mock Issue');
  }));

  it('should handle page change event', fakeAsync(() => {
    fixture.detectChanges();

    component.onPageChanged({
      pageIndex: 1,
      pageSize: 50,
      length: 100,
    } as PageEvent);
    tick();

    fixture.detectChanges();

    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(50);
  }));

  it('should handle sort change event and call service', fakeAsync(() => {
    const githubApiServiceSpy = spyOn(
      githubApiService,
      'getRepoIssues',
    ).and.returnValue(of(mockResponse));
    fixture.detectChanges();

    component.onSortChanged({ active: 'updated_at', direction: 'asc' } as Sort);
    tick();

    fixture.detectChanges();

    expect(component.sort()).toBe('updated_at');
    expect(component.sortOrder()).toBe('asc');

    expect(githubApiServiceSpy).toHaveBeenCalledWith('updated', 'asc', 1, 100);
  }));

  it('should display loading spinner while fetching data', fakeAsync(() => {
    component.isLoading.set(true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner).toBeTruthy();

    component.isLoading.set(false);
    tick();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('mat-spinner'))).toBeFalsy();
  }));

  it('should display error message on error', fakeAsync(() => {
    const errorMessage = 'Failed to load issues';

    spyOn(githubApiService, 'getRepoIssues').and.returnValue(
      throwError({ error: { message: errorMessage } }),
    );

    fixture.detectChanges();
    tick();

    fixture.detectChanges();

    const errorElem = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElem.nativeElement.textContent).toContain(errorMessage);
  }));
});
