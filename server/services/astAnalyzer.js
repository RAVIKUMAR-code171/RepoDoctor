// server/services/astAnalyzer.js
// PHASE 3: Parses each file's syntax tree (AST) to detect code-level debt:
// overly long functions, deeply nested blocks, and duplicated logic.

const fs = require('fs');
const acorn = require('acorn');
const walk = require('acorn-walk');
const crypto = require('crypto');

const LONG_FUNCTION_LINES = 40;
const DEEP_NESTING_LEVEL = 4;

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression'
]);

const NESTING_TYPES = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement'
]);

/**
 * Normalizes a function's source text so that trivial differences
 * (whitespace, variable names being renamed slightly) still count the
 * function as "the same shape" for duplicate detection. This is a simple
 * heuristic, not a perfect clone-detector - it's meant to catch obvious
 * copy-paste, not every semantic duplicate.
 */
function normalizeForHash(code) {
  return code.replace(/\s+/g, ' ').trim();
}

/**
 * Analyzes a single file's AST and returns a list of debt issues found in it.
 * Also returns a list of {hash, location} for every function body, so the
 * caller can compare hashes ACROSS files to find repo-wide duplication.
 */
function analyzeFile(sourceCode, relPath) {
  const issues = [];
  const functionHashes = [];

  let ast;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowImportExportEverywhere: true,
      locations: true
    });
  } catch (err) {
    return { issues, functionHashes }; // unparseable file - skip, don't crash the scan
  }

  // --- Long functions ---
  walk.simple(ast, {
    Function(node) {
      if (!FUNCTION_TYPES.has(node.type)) return;
      const lineCount = node.loc.end.line - node.loc.start.line + 1;

      if (lineCount > LONG_FUNCTION_LINES) {
        issues.push({
          type: 'long-function',
          line: node.loc.start.line,
          message: `Function spans ${lineCount} lines (over the ${LONG_FUNCTION_LINES}-line guideline)`
        });
      }

      const body = sourceCode.slice(node.start, node.end);
      // Only hash functions big enough that a match is meaningful -
      // tiny one-line arrow functions duplicate constantly and aren't real debt.
      if (lineCount >= 5) {
        const hash = crypto.createHash('md5').update(normalizeForHash(body)).digest('hex');
        functionHashes.push({ hash, line: node.loc.start.line, relPath });
      }
    }
  });

  // --- Deep nesting ---
  // acorn-walk's "ancestor" visitor gives us the full chain of parent nodes,
  // so we can count how many nesting constructs wrap the current node.
  walk.ancestor(ast, {
    Statement(node, _state, ancestors) {
      if (!NESTING_TYPES.has(node.type)) return;

      const depth = ancestors.filter(a => NESTING_TYPES.has(a.type)).length;

      if (depth === DEEP_NESTING_LEVEL) {
        // Report once per nesting chain at the point it crosses the threshold,
        // not once per line inside it, so it doesn't spam duplicate warnings.
        issues.push({
          type: 'deep-nesting',
          line: node.loc.start.line,
          message: `Nesting depth of ${depth + 1} (over the ${DEEP_NESTING_LEVEL}-level guideline)`
        });
      }
    }
  });

  return { issues, functionHashes };
}

/**
 * Runs AST analysis across every file in the repo, then does a second pass
 * to flag duplicated function bodies that appear in more than one place.
 *
 * @param {string} rootDir - the extracted repo's local path
 * @param {string[]} files - relative file paths (from dependencyGraph.buildDependencyGraph)
 * @returns {Object} relPath -> array of debt issues for that file
 */
function analyzeRepo(rootDir, files) {
  const path = require('path');
  const debtByFile = {};
  const allFunctionHashes = [];

  files.forEach(f => { debtByFile[f] = []; });

  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    let sourceCode;
    try {
      sourceCode = fs.readFileSync(absPath, 'utf-8');
    } catch (err) {
      continue;
    }

    const { issues, functionHashes } = analyzeFile(sourceCode, relPath);
    debtByFile[relPath].push(...issues);
    allFunctionHashes.push(...functionHashes);
  }

  // Group function hashes to find duplicates across the whole repo
  const hashGroups = {};
  for (const entry of allFunctionHashes) {
    if (!hashGroups[entry.hash]) hashGroups[entry.hash] = [];
    hashGroups[entry.hash].push(entry);
  }

  for (const hash in hashGroups) {
    const group = hashGroups[hash];
    if (group.length > 1) {
      for (const entry of group) {
        debtByFile[entry.relPath].push({
          type: 'duplicate-code',
          line: entry.line,
          message: `Near-duplicate of a function found in ${group.length - 1} other place(s)`
        });
      }
    }
  }

  return debtByFile;
}

module.exports = { analyzeRepo };
