const express = require('express');
const { Review } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  const reviews = await Review.findAll({
    order: [['createdAt', 'DESC']],
  });

  res.json(reviews);
});

router.get('/mine', requireAuth, async (req, res) => {
  const userId = Number(req.user.sub);
  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: 'Invalid token subject' });
  }

  const reviews = await Review.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });

  res.json(reviews);
});

router.post('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.sub);
  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: 'Invalid token subject' });
  }

  const { prUrl, diffText, status } = req.body;
  if (!prUrl || !diffText || !status) {
    return res.status(400).json({ error: 'prUrl, diffText, and status are required' });
  }

  const review = await Review.create({
    userId,
    prUrl,
    diffText,
    status,
  });

  return res.status(201).json(review);
});

module.exports = router;
