// server/routes/scan.js
// Wires Phases 0-4 together into one scan pipeline:
// fetch repo -> build graph -> PageRank -> Tarjan's -> AST debt -> risk score -> save

const express = require('express');
const requireAuth = require('../middleware/auth');
const Repo = require('../models/Repo');
const User = require('../models/User');
const Scan = require('../models/Scan');

const { fetchRepoFiles, cleanupRepoFiles } = require('../services/repoFetcher');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { computePageRank } = require('../services/pageRank');
const { detectCircularDependencies } = require('../services/tarjan');
const { analyzeRepo } = require('../services/astAnalyzer');
const { computeRiskScores } = require('../services/riskScoring');

const router = express.Router();

// POST /api/scan/:repoId - runs a full scan and saves the results
router.post('/:repoId', requireAuth, async (req, res) => {
  let tempDir;

  try {
    const repo = await Repo.findOne({ _id: req.params.repoId, owner: req.user.userId });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found or not tracked by you' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Phase 0: download + extract
    console.log('DEBUG - fullName:', repo.fullName);
    console.log('DEBUG - defaultBranch:', repo.defaultBranch);
    console.log('DEBUG - accessToken exists:', !!user.accessToken, 'length:', user.accessToken?.length);
    tempDir = await fetchRepoFiles(repo.fullName, repo.defaultBranch, user.accessToken);

    // Phase 1: dependency graph
    const { nodes, adjacency } = buildDependencyGraph(tempDir);

    if (nodes.length === 0) {
      cleanupRepoFiles(tempDir);
      return res.status(400).json({ error: 'No JavaScript/JSX files found in this repo' });
    }

    // Phase 2: PageRank + Tarjan's
    const pageRankScores = computePageRank(nodes, adjacency);
    const { cycles, filesInCycles } = detectCircularDependencies(nodes, adjacency);

    // Phase 3: AST debt detection
    const debtByFile = analyzeRepo(tempDir, nodes);

    // Phase 4: risk-weighted scoring
    const results = computeRiskScores(nodes, pageRankScores, filesInCycles, debtByFile);

    // Save this scan
    const scan = await Scan.create({
      repo: repo._id,
      owner: req.user.userId,
      fileCount: nodes.length,
      cycleCount: cycles.length,
      results
    });

    repo.lastAnalyzedAt = new Date();
    await repo.save();

    // Safe to delete the extracted files now - analysis is fully done
    cleanupRepoFiles(tempDir);

    res.json({ scan });

  } catch (error) {
    if (tempDir) cleanupRepoFiles(tempDir);
    console.error('Scan error:', error.message);
    res.status(500).json({ error: 'Scan failed: ' + error.message });
  }
});

// GET /api/scan/:repoId/latest - returns the most recent scan for a repo
router.get('/:repoId/latest', requireAuth, async (req, res) => {
  try {
    const scan = await Scan.findOne({
      repo: req.params.repoId,
      owner: req.user.userId
    }).sort({ createdAt: -1 });

    if (!scan) {
      return res.status(404).json({ error: 'No scans found for this repo yet' });
    }

    res.json({ scan });
  } catch (error) {
    console.error('Error fetching scan:', error.message);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

module.exports = router;
