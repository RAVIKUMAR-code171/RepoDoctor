# 🩺 RepoDoctor

**Technical debt analysis that prioritizes by architectural risk, not just code smells.**

🔗 **Live:** [repo-doctor-green.vercel.app](https://repo-doctor-green.vercel.app)

---

## The Problem

Most code-quality tools flag issues in isolation: "this function is too long," "this file is too nested." But they can't tell you whether that file is critical to the system or something nobody imports. You end up with hundreds of warnings and no idea which ones are dangerous.

**RepoDoctor maps how files depend on each other first**, finds the files that are structurally central or fragile, and only then scores technical debt, so the issues at the top of the list are the ones that are actually risky to leave unfixed.

## How It Works

The name follows a medical metaphor:

| Stage | What it does | How |
|---|---|---|
| **Anatomy** | Maps the codebase structure | Dependency graph built from `import` / `require` statements |
| **Vitals** | Finds the most critical files | PageRank centrality, implemented from scratch |
| **Weak points** | Finds fragile clusters | Tarjan's algorithm for circular dependency detection |
| **Diagnosis** | Detects code-level debt | AST analysis with `acorn` (long functions, deep nesting, duplication) |
| **Triage** | Prioritizes what to fix first | Risk-weighted 0-100 score per file |
| **Prescription** | Explains the fix in plain English | Gemini API (explanation only, no auto-applied code) |

## Features

- 🔐 GitHub OAuth login with JWT sessions
- 📦 Browse your GitHub repos and track the ones you want analyzed
- 🕸️ File-level dependency graph from any JavaScript/JSX repository
- 📊 PageRank to rank files by architectural centrality
- 🔁 Tarjan's strongly connected components to detect circular dependencies
- 🌳 AST-based debt detection: long functions, deep nesting, duplicated code
- ⚠️ Unified risk score combining centrality, fragility, and debt
- 🤖 AI-generated plain-English explanations and fix suggestions (Gemini)

## Risk Scoring

Each file gets a score from 0 to 100:

```
risk = 100 × (0.45 × centrality + 0.40 × debt + 0.15 × fragility)
```

- **Centrality**: the file's PageRank, normalized against the highest-ranked file
- **Debt**: number of AST-detected issues, normalized against the worst file
- **Fragility**: 1 if the file sits in a circular dependency cluster, otherwise 0

A messy file that many others depend on scores higher than an equally messy file nobody imports.

**Detection thresholds:** functions over 40 lines, nesting deeper than 4 levels, and near-identical function bodies (5+ lines) appearing in more than one place.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | GitHub OAuth 2.0, JWT |
| Parsing | acorn, acorn-walk |
| Algorithms | PageRank and Tarjan's SCC, hand-written in JavaScript |
| Repo ingestion | GitHub tarball API, `tar` |
| AI | Google Gemini API |
| Hosting | Vercel (client), Render (server) |

## Architecture

```
GitHub repo
    │
    ▼
Repo Fetcher ──► downloads + extracts tarball to a temp folder
    │
    ▼
Dependency Graph Builder ──► parses imports/requires into an adjacency list
    │
    ├──► PageRank ──────────► centrality score per file
    ├──► Tarjan's SCC ──────► circular dependency clusters
    └──► AST Analyzer ──────► debt issues per file
                │
                ▼
        Risk Scoring ──► ranked list of files
                │
                ▼
        Saved to MongoDB ──► shown in the dashboard
```

## Project Structure

```
RepoDoctor/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── pages/              # Login, Dashboard, RepoSelect, ScanResults
│       └── api/axios.js        # Axios instance with JWT interceptor
└── server/                     # Express backend
    ├── models/                 # User, Repo, Scan
    ├── routes/                 # auth, repos, scan
    ├── middleware/auth.js      # JWT verification
    └── services/
        ├── githubService.js    # GitHub API calls
        ├── repoFetcher.js      # download + extract repo
        ├── dependencyGraph.js  # import/require parsing
        ├── pageRank.js         # PageRank implementation
        ├── tarjan.js           # Tarjan's SCC implementation
        ├── astAnalyzer.js      # acorn-based debt detection
        └── riskScoring.js      # combined risk score
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/github` | Start GitHub OAuth flow |
| GET | `/api/repos/github` | List repos from your GitHub account |
| POST | `/api/repos/track` | Track a repo for analysis |
| GET | `/api/repos/tracked` | List tracked repos |
| POST | `/api/scan/:repoId` | Run a full scan on a tracked repo |
| GET | `/api/scan/:repoId/latest` | Get the most recent scan results |

All routes except auth require a `Bearer` JWT.

## Running Locally

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster, a GitHub OAuth App, and a Gemini API key.

```bash
# clone
git clone https://github.com/RAVIKUMAR-code171/RepoDoctor.git
cd RepoDoctor

# backend
cd server
npm install
cp .env.example .env     # fill in the values below
npm run start

# frontend (new terminal)
cd client
npm install
npm run dev
```

**`server/.env`**
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

For the GitHub OAuth App, set the callback URL to match `GITHUB_CALLBACK_URL`.

## Design Decisions

- **Algorithms written from scratch.** PageRank and Tarjan's are implemented directly rather than pulled from a graph library. Tarjan's is iterative, so large repos don't overflow the call stack.
- **AI explains, it doesn't edit.** Gemini produces plain-English explanations and suggestions only. The developer writes the actual fix.
- **Resilient parsing.** Files that fail to parse are skipped instead of crashing the whole scan.
- **Temp files are cleaned up.** Extracted repos are deleted as soon as analysis finishes.

## Current Limitations

- Analyzes JavaScript and JSX files; TypeScript is not parsed yet
- Only relative imports are resolved; path aliases (like `@/components`) are not
- Duplicate detection is hash-based, so it catches copy-paste but not semantic duplicates

## Roadmap

- [ ] Blast radius view: show everything affected when a given file changes
- [ ] Interactive dependency graph visualization (D3.js)
- [ ] TypeScript support
- [ ] Debt trend tracking across scans

## Author

**Ravi Kumar**
[GitHub](https://github.com/RAVIKUMAR-code171) · [LinkedIn](https://www.linkedin.com/in/ravi-kumar-11b326286/)
