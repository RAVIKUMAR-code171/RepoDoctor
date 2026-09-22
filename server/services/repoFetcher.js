// server/services/repoFetcher.js
// PHASE 0: Downloads a GitHub repo's tarball and extracts it to a local temp folder.

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const tar = require('tar');

/**
 * Downloads a GitHub repo's tarball and extracts it to a local temp folder.
 * @param {string} fullName - e.g. "veerkumar/repodoctor" (matches Repo.fullName)
 * @param {string} defaultBranch - e.g. "main" (matches Repo.defaultBranch)
 * @param {string} accessToken - the user's GitHub access token (matches User.accessToken)
 * @returns {Promise<string>} the local folder path where the repo's files now live
 */
async function fetchRepoFiles(fullName, defaultBranch, accessToken) {
  const safeName = fullName.replace('/', '__');
  const tempDir = path.join(os.tmpdir(), 'repodoctor', `${safeName}_${Date.now()}`);

  fs.mkdirSync(tempDir, { recursive: true });

  const tarballUrl = `https://api.github.com/repos/${fullName}/tarball/${defaultBranch}`;

  let response;
  try {
    response = await axios({
      method: 'get',
      url: tarballUrl,
      responseType: 'stream',
      headers: {
        Authorization: `token ${accessToken}`,
        'User-Agent': 'RepoDoctor-App'
      }
    });
  } catch (err) {
    console.error('DEBUG - tarball fetch failed');
    console.error('DEBUG - URL:', tarballUrl);
    console.error('DEBUG - status:', err.response?.status);
    console.error('DEBUG - GitHub message:', err.response?.data);
    throw err;
  }

  // strip: 1 removes GitHub's auto-generated top-level wrapper folder
  await new Promise((resolve, reject) => {
    response.data
      .pipe(tar.extract({ cwd: tempDir, strip: 1 }))
      .on('finish', resolve)
      .on('error', reject);
  });

  return tempDir;
}

/**
 * Deletes a temp folder once we're done analyzing it. Call this AFTER
 * the dependency graph + AST analysis have both finished reading the files.
 */
function cleanupRepoFiles(tempDir) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Cleanup failed for', tempDir, err.message);
  }
}

module.exports = { fetchRepoFiles, cleanupRepoFiles };
