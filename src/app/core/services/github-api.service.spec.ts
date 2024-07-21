import { TestBed } from '@angular/core/testing';

import { GithubApiService } from './github-api.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GithubIssuesResponse } from '../models/github-issues-response';
import { SortDirection } from '@angular/material/sort';

describe('GithubApiService', () => {
  let service: GithubApiService;
  let httpMock: HttpTestingController;
  const baseHref = 'https://api.github.com';
  const mockResponse: GithubIssuesResponse = {
    total_count: 1,
    incomplete_results: false,
    items: [],
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GithubApiService],
    });
    service = TestBed.inject(GithubApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getRepoIssues with correct URL and parameters', () => {
    const sort = 'created';
    const order: SortDirection = 'asc';
    const page = 1;
    const perPage = 10;

    service.getRepoIssues(sort, order, page, perPage).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${baseHref}/search/issues?q=repo:angular/components&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
