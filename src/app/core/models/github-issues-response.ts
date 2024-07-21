import { GithubIssue } from './github-issue';

export interface GithubIssuesResponse {
  items: GithubIssue[];
  total_count: number;
  incomplete_results: boolean;
}
