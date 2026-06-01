const axios = require('axios');

const GITHUB_API_BASE_URL = 'https://api.github.com';

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createGitHubHeaders(accessToken, accept = 'application/vnd.github+json') {
  if (!accessToken) {
    throw createHttpError(401, 'Missing GitHub access token');
  }

  return {
    Authorization: 'Bearer ' + accessToken,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function normalizeGitHubError(error, fallbackMessage = 'GitHub API request failed') {
  if (!error.response) {
    return createHttpError(502, fallbackMessage);
  }

  const { status, data } = error.response;
  const message = typeof data?.message === 'string' ? data.message : fallbackMessage;

  if (status === 401) {
    return createHttpError(401, 'GitHub authentication failed');
  }
  if (status === 403) {
    return createHttpError(403, 'GitHub API rate limit reached or access forbidden');
  }
  if (status === 404) {
    return createHttpError(404, 'GitHub resource not found');
  }

  return createHttpError(status, message);
}

function parsePrUrl(prUrl) {
  if (!prUrl || typeof prUrl !== 'string') {
    throw createHttpError(400, 'prUrl is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(prUrl);
  } catch (_error) {
    throw createHttpError(400, 'Invalid PR URL format');
  }

  const normalizedHost = parsedUrl.hostname.toLowerCase();
  if (normalizedHost !== 'github.com' && normalizedHost !== 'www.github.com') {
    throw createHttpError(400, 'PR URL must be a GitHub URL');
  }

  const match = parsedUrl.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/);
  if (!match) {
    throw createHttpError(400, 'PR URL must match /owner/repo/pull/number');
  }

  return {
    owner: decodeURIComponent(match[1]),
    repo: decodeURIComponent(match[2]),
    pullNumber: Number(match[3]),
  };
}

async function fetchUserRepos(accessToken, { page = 1, perPage = 30 } = {}) {
  try {
    const response = await axios.get(`${GITHUB_API_BASE_URL}/user/repos`, {
      headers: createGitHubHeaders(accessToken),
      params: {
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      },
    });

    return response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
    }));
  } catch (error) {
    throw normalizeGitHubError(error, 'Failed to fetch repositories from GitHub');
  }
}

async function fetchPullRequestDiff(accessToken, { owner, repo, pullNumber }) {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
      {
        headers: createGitHubHeaders(accessToken, 'application/vnd.github.v3.diff'),
        responseType: 'text',
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeGitHubError(error, 'Failed to fetch pull request diff from GitHub');
  }
}

function createEmptyParsedDiff() {
  return {
    totalFiles: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    files: [],
  };
}

function parseDiffPaths(line) {
  const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
  if (!match) {
    return null;
  }

  return {
    oldPath: match[1],
    newPath: match[2],
  };
}

function parseUnifiedDiff(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    return createEmptyParsedDiff();
  }

  const lines = diffText.split('\n');
  const files = [];
  let currentFile = null;
  let currentHunk = null;

  function finalizeCurrentFile() {
    if (!currentFile) {
      return;
    }

    currentFile.hunksCount = currentFile.hunks.length;
    files.push(currentFile);
  }

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      finalizeCurrentFile();
      const paths = parseDiffPaths(line);
      currentFile = {
        oldPath: paths?.oldPath || null,
        newPath: paths?.newPath || null,
        status: 'modified',
        additions: 0,
        deletions: 0,
        hunks: [],
      };
      currentHunk = null;
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith('new file mode ')) {
      currentFile.status = 'added';
      continue;
    }
    if (line.startsWith('deleted file mode ')) {
      currentFile.status = 'deleted';
      continue;
    }
    if (line.startsWith('rename from ')) {
      currentFile.status = 'renamed';
      currentFile.oldPath = line.slice('rename from '.length).trim();
      continue;
    }
    if (line.startsWith('rename to ')) {
      currentFile.status = 'renamed';
      currentFile.newPath = line.slice('rename to '.length).trim();
      continue;
    }
    if (line.startsWith('--- ')) {
      const oldPath = line.slice(4).trim().replace(/^a\//, '');
      currentFile.oldPath = oldPath === '/dev/null' ? null : oldPath;
      continue;
    }
    if (line.startsWith('+++ ')) {
      const newPath = line.slice(4).trim().replace(/^b\//, '');
      currentFile.newPath = newPath === '/dev/null' ? null : newPath;
      continue;
    }
    if (line.startsWith('@@')) {
      currentHunk = {
        header: line,
        additions: 0,
        deletions: 0,
        lines: [],
      };
      currentFile.hunks.push(currentHunk);
      continue;
    }
    if (!currentHunk) {
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentFile.additions += 1;
      currentHunk.additions += 1;
      currentHunk.lines.push({ type: 'add', content: line.slice(1) });
      continue;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      currentFile.deletions += 1;
      currentHunk.deletions += 1;
      currentHunk.lines.push({ type: 'del', content: line.slice(1) });
      continue;
    }

    currentHunk.lines.push({ type: 'context', content: line.startsWith(' ') ? line.slice(1) : line });
  }

  finalizeCurrentFile();

  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return {
    totalFiles: files.length,
    totalAdditions,
    totalDeletions,
    files,
  };
}

module.exports = {
  parsePrUrl,
  fetchUserRepos,
  fetchPullRequestDiff,
  parseUnifiedDiff,
};
