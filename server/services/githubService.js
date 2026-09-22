// server/services/githubService.js

const axios = require('axios');

// Fetch all repositories for the logged-in user
async function getUserRepos(accessToken) {
  const response = await axios.get('https://api.github.com/user/repos', {
    headers: {
      Authorization: `token ${accessToken}`
    },
    params: {
      sort: 'updated',   // most recently updated repos first
      per_page: 100      // get up to 100 repos in one call
    }
  });

  // We only need certain fields, not GitHub's full bulky response
  return response.data.map(repo => ({
    githubRepoId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language,
    isPrivate: repo.private,
    stars: repo.stargazers_count,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url
  }));
}

module.exports = { getUserRepos };