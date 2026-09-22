// server/routes/auth.js

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// STEP 1: Redirect user to GitHub's login page
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=repo,user:email`;
  res.redirect(githubAuthUrl);
});

// STEP 2: GitHub redirects back here with a temporary "code"
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided by GitHub' });
  }

  try {
    // STEP 3: Exchange the temporary code for an access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get access token from GitHub' });
    }

    // STEP 4: Use the access token to fetch the user's GitHub profile
    const githubUserResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const githubUser = githubUserResponse.data;

    // Try to get email separately (GitHub sometimes hides it in the main profile)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` }
      });
      const primaryEmail = emailsResponse.data.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : null;
    }

    // STEP 5: Save or update this user in our database
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (user) {
      // User already exists, update their info
      user.accessToken = accessToken;
      user.username = githubUser.login;
      user.displayName = githubUser.name;
      user.avatarUrl = githubUser.avatar_url;
      user.email = email;
      await user.save();
    } else {
      // New user, create them
      user = await User.create({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        displayName: githubUser.name,
        email: email,
        avatarUrl: githubUser.avatar_url,
        accessToken: accessToken
      });
    }

    // STEP 6: Create our own JWT token (our app's login session token)
    const jwtToken = jwt.sign(
      { userId: user._id, githubId: user.githubId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // STEP 7: Redirect back to frontend with our JWT token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${jwtToken}`);

  } catch (error) {
    console.error('GitHub OAuth error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;