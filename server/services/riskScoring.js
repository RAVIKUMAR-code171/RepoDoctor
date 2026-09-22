// server/services/riskScoring.js
// PHASE 4: Combines PageRank centrality + Tarjan fragility + AST debt count
// into a single 0-100 risk score per file, so the most DANGEROUS files to
// leave messy rank above files that are merely messy but unimportant.
//
// Weighting rationale (tune these if you want to explain trade-offs in an
// interview): centrality and debt matter roughly equally, because a file
// that's both central AND messy is the real danger zone. Fragility (being
// stuck in a circular dependency) adds a smaller flat bonus on top, since
// it's a structural red flag independent of how "big" the debt looks.
const WEIGHTS = {
  centrality: 0.45,
  debt: 0.40,
  fragility: 0.15
};

/**
 * @param {string[]} nodes - all file paths
 * @param {Object} pageRankScores - file -> raw pagerank value
 * @param {Set<string>} filesInCycles - files that are part of a circular dependency
 * @param {Object} debtByFile - file -> array of debt issues (from astAnalyzer)
 * @returns {Array} sorted array of { filePath, riskScore, pageRank, inCycle, debtCount, debtIssues }
 */
function computeRiskScores(nodes, pageRankScores, filesInCycles, debtByFile) {
  const maxPageRank = Math.max(...Object.values(pageRankScores), 0.000001);
  const maxDebtCount = Math.max(
    ...nodes.map(f => (debtByFile[f] || []).length),
    1
  );

  const results = nodes.map(file => {
    const pageRank = pageRankScores[file] || 0;
    const debtIssues = debtByFile[file] || [];
    const inCycle = filesInCycles.has(file);

    // Normalize each factor to a 0-1 scale before weighting, so no single
    // factor dominates just because of its raw units.
    const centralityNorm = pageRank / maxPageRank;
    const debtNorm = debtIssues.length / maxDebtCount;
    const fragilityNorm = inCycle ? 1 : 0;

    const riskScore = Math.round(
      100 * (
        WEIGHTS.centrality * centralityNorm +
        WEIGHTS.debt * debtNorm +
        WEIGHTS.fragility * fragilityNorm
      )
    );

    return {
      filePath: file,
      riskScore,
      pageRank: Number(pageRank.toFixed(6)),
      inCycle,
      debtCount: debtIssues.length,
      debtIssues
    };
  });

  results.sort((a, b) => b.riskScore - a.riskScore);
  return results;
}

module.exports = { computeRiskScores };
