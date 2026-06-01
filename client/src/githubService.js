import { apiRequest } from './api';

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function getUserRepos({ page = 1, perPage = 30 } = {}) {
  const safePage = toPositiveInt(page, 1);
  const safePerPage = Math.min(toPositiveInt(perPage, 30), 100);
  const params = new URLSearchParams({
    page: String(safePage),
    per_page: String(safePerPage),
  });

  return apiRequest(`/api/github/repos?${params.toString()}`);
}

async function getPullRequestDiff(prUrl) {
  if (!prUrl || !prUrl.trim()) {
    throw new Error('PR URL is required');
  }

  const params = new URLSearchParams({
    prUrl: prUrl.trim(),
  });

  return apiRequest(`/api/github/pr-diff?${params.toString()}`);
}

export { getUserRepos, getPullRequestDiff };
