const express = require('express');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const {
  parsePrUrl,
  fetchUserRepos,
  fetchPullRequestDiff,
  parseUnifiedDiff,
} = require('../services/githubService');

const router = express.Router();
const protectedRouteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

router.use(protectedRouteRateLimit, requireAuth);

function getAuthenticatedUserId(req) {
  const userId = Number(req.user.sub);
  if (!Number.isInteger(userId)) {
    throw Object.assign(new Error('Invalid token subject'), { status: 401 });
  }

  return userId;
}

async function getUserAccessToken(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'accessToken'],
  });

  if (!user?.accessToken) {
    throw Object.assign(new Error('Missing GitHub access token for user'), { status: 401 });
  }

  return user.accessToken;
}

function toSafePositiveInt(value, fallback, min = 1, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

router.get('/repos', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const accessToken = await getUserAccessToken(userId);
    const page = toSafePositiveInt(req.query.page, 1, 1, 1000);
    const perPage = toSafePositiveInt(req.query.per_page, 30, 1, 100);
    const repos = await fetchUserRepos(accessToken, { page, perPage });

    return res.json({
      page,
      perPage,
      count: repos.length,
      repos,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch repositories' });
  }
});

router.get('/pr-diff', async (req, res) => {
  try {
    const prUrl = typeof req.query.prUrl === 'string' ? req.query.prUrl.trim() : '';
    if (!prUrl) {
      return res.status(400).json({ error: 'prUrl query parameter is required' });
    }

    const userId = getAuthenticatedUserId(req);
    const accessToken = await getUserAccessToken(userId);
    const pullRequest = parsePrUrl(prUrl);
    const diffText = await fetchPullRequestDiff(accessToken, pullRequest);
    const parsedDiff = parseUnifiedDiff(diffText);

    return res.json({
      pullRequest,
      diffText,
      parsedDiff,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to fetch pull request diff' });
  }
});

module.exports = router;
