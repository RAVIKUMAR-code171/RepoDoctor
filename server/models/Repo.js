// server/models/Repo.js

const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  githubRepoId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  language: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  htmlUrl: {
    type: String
  },
  isTracked: {
    type: Boolean,
    default: true
  },
  lastAnalyzedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Repo', repoSchema);