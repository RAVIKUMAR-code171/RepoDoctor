// server/routes/repos.js

const express = require('express');
const requireAuth = require('../middleware/auth');
const User = require('../models/User');
const Repo = require('../models/Repo');
const { getUserRepos } = require('../services/githubService');

const router = express.Router();

// GET /api/repos/github - fetch the user's repo list DIRECTLY from GitHub (not yet saved)
router.get('/github', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repos = await getUserRepos(user.accessToken);
    res.json({ repos });

  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message);
    res.status(500).json({ error: 'Failed to fetch repos from GitHub' });
  }
});

// POST /api/repos/track - save a chosen repo to our database so we track it
router.post('/track', requireAuth, async (req, res) => {
  try {
    const { githubRepoId, name, fullName, description, language, isPrivate, defaultBranch, htmlUrl } = req.body;

    // Check if this repo is already tracked by this user
    const existing = await Repo.findOne({ owner: req.user.userId, githubRepoId });

    if (existing) {
      return res.status(400).json({ error: 'Repo is already tracked' });
    }

    const repo = await Repo.create({
      owner: req.user.userId,
      githubRepoId,
      name,
      fullName,
      description,
      language,
      isPrivate,
      defaultBranch,
      htmlUrl
    });

    res.json({ repo });

  } catch (error) {
    console.error('Error tracking repo:', error.message);
    res.status(500).json({ error: 'Failed to track repo' });
  }
});

// GET /api/repos/tracked - get the list of repos THIS user has already chosen to track
router.get('/tracked', requireAuth, async (req, res) => {
  try {
    const repos = await Repo.find({ owner: req.user.userId }).sort({ createdAt: -1 });
    res.json({ repos });
  } catch (error) {
    console.error('Error fetching tracked repos:', error.message);
    res.status(500).json({ error: 'Failed to fetch tracked repos' });
  }
});

module.exports = router;