import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GithubIssuesResponse } from '../models/github-issues-response';
import { Observable } from 'rxjs';
import { SortDirection } from '@angular/material/sort';
import { GitHubOrderKey } from '../models/github-order-key';

@Injectable({
  providedIn: 'root',
})
export class GithubApiService {
  baseHref = 'https://api.github.com';
  httpClient = inject(HttpClient);

  getRepoIssues(
    sort: GitHubOrderKey,
    order: SortDirection = 'desc',
    page: number = 1,
    perPage: number = 100,
  ): Observable<GithubIssuesResponse> {
    const href = `${this.baseHref}/search/issues`;
    const requestUrl = `${href}?q=repo:angular/components&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`;

    return this.httpClient.get<GithubIssuesResponse>(requestUrl);
  }
}
