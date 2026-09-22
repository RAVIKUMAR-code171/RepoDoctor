// server/services/dependencyGraph.js
// PHASE 1: Walks the extracted repo folder, parses each JS/JSX file with acorn,
// and builds a graph of which files import which other files.

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const JS_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'out']);

/**
 * Recursively collects every JS/JSX file path under rootDir.
 * Returns paths RELATIVE to rootDir (this is what we use as graph node ids).
 */
function collectFiles(rootDir, currentDir = rootDir, results = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(rootDir, fullPath, results);
    } else if (JS_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(path.relative(rootDir, fullPath));
    }
  }

  return results;
}

/**
 * Given an importer's relative path and the string inside import/require(),
 * tries to resolve it to one of the known file nodes. Returns null if it's
 * an external package (e.g. "react") or can't be resolved.
 */
function resolveImport(rootDir, importerRelPath, importSpecifier, knownFiles) {
  // Only resolve relative imports - anything else is an external npm package
  if (!importSpecifier.startsWith('.')) return null;

  const importerDir = path.dirname(importerRelPath);
  const rawResolved = path.normalize(path.join(importerDir, importSpecifier));

  // Try the path as-is, then with each extension, then as a directory's index file
  const candidates = [
    rawResolved,
    ...JS_EXTENSIONS.map(ext => rawResolved + ext),
    ...JS_EXTENSIONS.map(ext => path.join(rawResolved, 'index' + ext))
  ];

  for (const candidate of candidates) {
    const normalized = candidate.split(path.sep).join('/');
    if (knownFiles.has(normalized)) return normalized;
  }

  return null;
}

/**
 * Parses one file's source code and returns the list of raw import strings
 * it contains (both ES "import" and CommonJS "require(...)").
 */
function extractImportSpecifiers(sourceCode, isJsx) {
  const specifiers = [];

  let ast;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowImportExportEverywhere: true,
      // acorn can't parse JSX syntax on its own; if the file is .jsx and
      // this throws, we just skip it (caught by the caller) rather than crash.
      ...(isJsx ? {} : {})
    });
  } catch (err) {
    return specifiers; // unparseable file - skip it, don't crash the whole scan
  }

  walk.simple(ast, {
    ImportDeclaration(node) {
      specifiers.push(node.source.value);
    },
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length > 0 &&
        node.arguments[0].type === 'Literal'
      ) {
        specifiers.push(node.arguments[0].value);
      }
    }
  });

  return specifiers;
}

/**
 * Builds the full dependency graph for a repo that's already been extracted
 * to `rootDir` by repoFetcher.fetchRepoFiles().
 *
 * @returns {{ nodes: string[], edges: Array<{from: string, to: string}>, adjacency: Object }}
 */
function buildDependencyGraph(rootDir) {
  const files = collectFiles(rootDir).map(f => f.split(path.sep).join('/'));
  const knownFiles = new Set(files);

  const edges = [];
  const adjacency = {}; // file -> array of files it imports
  files.forEach(f => { adjacency[f] = []; });

  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    let sourceCode;
    try {
      sourceCode = fs.readFileSync(absPath, 'utf-8');
    } catch (err) {
      continue;
    }

    const isJsx = relPath.endsWith('.jsx');
    const specifiers = extractImportSpecifiers(sourceCode, isJsx);

    for (const spec of specifiers) {
      const resolved = resolveImport(rootDir, relPath, spec, knownFiles);
      if (resolved && resolved !== relPath) {
        edges.push({ from: relPath, to: resolved });
        adjacency[relPath].push(resolved);
      }
    }
  }

  return { nodes: files, edges, adjacency };
}

module.exports = { buildDependencyGraph };
