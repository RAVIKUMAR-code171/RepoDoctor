// server/services/pageRank.js
// PHASE 2a: Ranks files by architectural centrality using PageRank.
//
// Intuition: a file is "important" if it is imported by other important
// files. This is exactly the same math Google originally used to rank web
// pages by which pages link to them - here, "links" are import statements.

const DAMPING = 0.85;
const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-6;

/**
 * @param {string[]} nodes - all file paths
 * @param {Object} adjacency - file -> array of files it imports (out-links)
 * @returns {Object} file -> pagerank score (0 to 1, all scores sum to ~1)
 */
function computePageRank(nodes, adjacency) {
  const N = nodes.length;
  if (N === 0) return {};

  // Build reverse adjacency: file -> array of files that import IT (in-links).
  // PageRank flows "importance" backwards along import edges - if A imports B,
  // B gets importance credit from A, because A depends on B existing/working.
  const inLinks = {};
  nodes.forEach(n => { inLinks[n] = []; });
  for (const file of nodes) {
    for (const target of adjacency[file] || []) {
      if (inLinks[target]) inLinks[target].push(file);
    }
  }

  const outDegree = {};
  nodes.forEach(n => { outDegree[n] = (adjacency[n] || []).length; });

  // Start every file with equal rank
  let ranks = {};
  nodes.forEach(n => { ranks[n] = 1 / N; });

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const newRanks = {};
    let danglingSum = 0;

    // Files with no outgoing imports ("dangling nodes") would otherwise leak
    // rank out of the system - redistribute their rank evenly to everyone.
    for (const file of nodes) {
      if (outDegree[file] === 0) danglingSum += ranks[file];
    }

    for (const file of nodes) {
      let incomingRank = 0;
      for (const source of inLinks[file]) {
        incomingRank += ranks[source] / outDegree[source];
      }
      newRanks[file] =
        (1 - DAMPING) / N +
        DAMPING * (incomingRank + danglingSum / N);
    }

    // Check for convergence - if scores barely changed, stop early
    let diff = 0;
    for (const file of nodes) {
      diff += Math.abs(newRanks[file] - ranks[file]);
    }

    ranks = newRanks;
    if (diff < TOLERANCE) break;
  }

  return ranks;
}

module.exports = { computePageRank };
