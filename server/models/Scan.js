// server/models/Scan.js

const mongoose = require('mongoose');

const debtIssueSchema = new mongoose.Schema({
  type: { type: String, required: true },
  line: { type: Number },
  message: { type: String }
}, { _id: false });

const fileResultSchema = new mongoose.Schema({
  filePath: { type: String, required: true },
  riskScore: { type: Number, required: true },
  pageRank: { type: Number, required: true },
  inCycle: { type: Boolean, default: false },
  debtCount: { type: Number, default: 0 },
  debtIssues: [debtIssueSchema]
}, { _id: false });

const scanSchema = new mongoose.Schema({
  repo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileCount: {
    type: Number,
    default: 0
  },
  cycleCount: {
    type: Number,
    default: 0
  },
  results: [fileResultSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
