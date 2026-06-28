# Solvora ⚡
 
> A full-stack competitive programming platform where you can solve problems, compete in contests, and get AI-powered help — all in one place.
 
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://solvora-cp.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-EC2-orange)](http://16.16.26.216)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Made with](https://img.shields.io/badge/Made%20with-MERN-yellow)](https://github.com/nehayadav827/solvora-cp)
 
---
 
## What is Solvora?
 
Solvora is an online judge platform — think LeetCode or Codeforces, but built from scratch.
 
You write code in your browser, hit submit, and within seconds you know if your solution is correct. Your code runs inside a secure Docker container on a real server, gets tested against hidden test cases, and you get a verdict — Accepted, Wrong Answer, Time Limit Exceeded, etc.
 
Built as part of a Co-op Internship at AlgoUniversity (backed by Y Combinator).
 
---
 
## Live Links
 
| | Link |
|---|---|
| 🌐 Frontend | [https://solvora-cp.vercel.app](https://solvora-cp.vercel.app) |
| |
| 📹 Demo Video | https://www.loom.com/share/2a5cd86138404ed28e7011ab77e6acdd |
| 💻 Repository | [GitHub](https://github.com/nehayadav827/solvora-cp) |
 
---
 
## Features
 
### 🔐 Authentication
- Register and login with email + password
- JWT access tokens (15 min) + refresh tokens (7 days)
- Tokens stored in httpOnly cookies — JavaScript can't steal them
- Auto-refresh when access token expires — you never get logged out unexpectedly
- Role-based access — user / admin / problemsetter
- Protected routes — submit code requires login, browsing does not
### 💻 Online Judge (Core Feature)
- Write code directly in the browser (Monaco Editor — same as VS Code)
- Run code against your own custom input
- Submit code — runs against hidden test cases automatically
- Supports C++, Java, Python, JavaScript
- Verdicts: Accepted ✅, Wrong Answer ❌, Time Limit Exceeded ⏱️, Runtime Error 💥, Compile Error 🔧
- Every submission runs in an isolated Docker container
### 🔒 Docker Sandboxed Execution
- Each submission gets its own fresh Docker container
- No internet access inside the container
- Hard memory limit: 256MB
- Hard time limit: 5 seconds
- PID limit: prevents fork bombs
- Container destroyed immediately after execution
### 📋 Problem Management
- Browse all problems with search, difficulty filter, and tag filter
- Pagination — 20 problems per page
- Each problem has: statement, constraints, examples, hidden test cases
- Hidden test cases never sent to the frontend — only the judge sees them
- Difficulty levels: Easy 🟢, Medium 🟡, Hard 🔴
### 🏆 Contest Module
- Live contests with countdown timer
- Register for contests before they start
- Problems hidden until contest starts
- ACM-style scoring with penalty time (20 min per wrong answer)
- Live scoreboard — updates as people submit
- My Submissions tab — see all your contest attempts
- Past contests viewable after they end
### 📊 Dashboard
- Total problems solved
- Submission history
- Difficulty breakdown (Easy / Medium / Hard)
- Language usage stats
- Activity heatmap — last 30 days
- All solved problems listed
### 🏅 Leaderboard
- Global ranking by problems solved
- Podium display for top 3
- Score bar visualization
- "You" badge highlights your position
### 🤖 AI Features (powered by Groq LLaMA 3.3)
All 7 features available inside the code editor on every problem:
- **Code Review** — reviews your code for bugs and quality
- **Complexity Analysis** — tells you Time and Space complexity
- **Hint Generator** — 3 levels (vague → moderate → strong) so you learn, not just copy
- **Wrong Answer Explanation** — explains why your code failed
- **Error Explanation** — explains compile/runtime errors in plain English
- **Test Case Generator** — generates 6 test cases including edge cases
- **Dry Run Visualizer** — traces your code step by step with variable values
---
 
## Tech Stack
 
### Frontend
| Technology | Purpose |
|---|---|
| React.js 18 | UI framework |
| Vite | Build tool, fast dev server |
| React Router v6 | Client-side routing |
| Zustand | Global state (auth, user) |
| Axios | HTTP requests + auto token refresh |
| Monaco Editor | VS Code quality code editor |
| TanStack Query | Server state, caching |
 
### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Helmet.js | Security HTTP headers |
| express-rate-limit | Rate limiting |
| DOMPurify | XSS sanitization |
| cookie-parser | Cookie handling |
 
### Database
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Primary database (cloud hosted) |
| Mongoose | ODM — schema + validation |
 
### Code Execution
| Technology | Purpose |
|---|---|
| Docker | Container runtime |
| Alpine Linux images | Lightweight language images |
| g++ | C++ compiler |
| JDK 17 | Java compiler + runtime |
| Python 3.11 | Python interpreter |
| Node.js 20 | JavaScript runtime |
 
### AI
| Technology | Purpose |
|---|---|
| Groq API | Fast AI inference |
| LLaMA 3.3 70B | Language model |
 
### Deployment
| Technology | Purpose |
|---|---|
| AWS EC2 t3.micro | Backend server |
| Vercel | Frontend hosting |
| PM2 | Process manager — keeps Node.js alive |
| Nginx | Reverse proxy — routes traffic to Node.js |
 
---
 
## Architecture
 
Here's how everything connects:
 
```
User's Browser (Vercel)
        |
   React Frontend
        |  (HTTPS requests via Vercel proxy)
   Nginx on EC2
        |
  Express.js Server (Node.js)
        |
   Controllers -> Models
        |
   MongoDB Atlas
 
When code is submitted:
   Express Server
        |
   Generates code file + input file
        |
   Docker container starts
        |
   Code runs inside container (isolated)
        |
   Output compared to expected
        |
   Verdict saved to MongoDB
        |
   Response sent to browser
```
 
### Authentication Flow
```
1. User logs in -> server creates access token (15min) + refresh token (7d)
2. Refresh token stored in httpOnly cookie
3. Access token stored in memory (Zustand)
4. Every API request sends access token in Authorization header
5. When access token expires -> interceptor auto-calls /auth/refresh
6. New access token issued -> original request retried
7. User never notices anything happened
```
 
### Docker Execution Flow
```
1. User submits code
2. Backend saves code to a temp file (UUID filename)
3. Input saved to a temp file
4. Docker container starts with:
   - Code file mounted as read-only
   - Input file mounted as read-only
   - No internet (--network none)
   - Memory cap (--memory 256m)
   - PID limit (--pids-limit 64)
5. Code compiled (if C++/Java) and run inside same container
6. Output captured, compared to expected output
7. Container destroyed
8. Verdict returned
```
 
---
 
## Folder Structure
 
```
codearena/
|
|-- frontend/
|   |-- src/
|   |   |-- api/              # All axios API calls (authApi, problemApi, etc.)
|   |   |-- components/
|   |   |   |-- common/       # Navbar, ProtectedRoute, ErrorBoundary, Pagination
|   |   |   |-- compiler/     # CodeEditor, LanguageSelector, OutputPanel, VerdictCard
|   |   |   |-- problems/     # ProblemCard, ProblemFilters, ProblemStatement
|   |   |   |-- contest/      # ContestTimer, ContestStatusBadge
|   |   |   |-- ai/           # AiPanel with all 7 features
|   |   |   `-- submissions/  # SubmissionHistory
|   |   |-- pages/            # One file per route (Problems, ProblemDetail, etc.)
|   |   |-- store/            # Zustand store (authStore)
|   |   |-- constants/        # Languages config, difficulty colors
|   |   |-- utils/            # Helper functions
|   |   `-- App.jsx           # Routes defined here
|   |-- vercel.json           # Vercel rewrite rules for React Router + API proxy
|   `-- vite.config.js
|
|-- backend/
|   |-- src/
|   |   |-- config/           # DB connection, Groq client setup
|   |   |-- controllers/      # Business logic (auth, problems, submissions, etc.)
|   |   |-- middleware/       # protect, restrictTo, validateRequest
|   |   |-- models/           # Mongoose schemas (User, Problem, Submission, etc.)
|   |   |-- routes/           # Express route definitions
|   |   `-- utils/            # generateToken helpers
|   |-- compiler/
|   |   |-- generateFile.js       # Creates temp code file with UUID name
|   |   |-- generateInputFile.js  # Creates temp input file
|   |   |-- executeCode.js        # Runs code locally or via Docker
|   |   |-- cleanup.js            # Deletes temp files after execution
|   |   |-- compilerController.js # Handles /run route
|   |   `-- compilerRoutes.js     # Compiler route definitions
|   |-- docker/
|   |   |-- cpp/Dockerfile
|   |   |-- java/Dockerfile
|   |   |-- python/Dockerfile
|   |   |-- javascript/Dockerfile
|   |   `-- build-images.sh       # Builds all 4 images at once
|   `-- server.js                 # Entry point
|
`-- README.md
```
 
---
 
## Database Design
 
### Users
| Field | Type | Purpose |
|---|---|---|
| firstName, lastName | String | Display name |
| email | String (unique) | Login identifier |
| password | String | bcrypt hashed — never stored as plain text |
| role | Enum | user / admin / problemsetter |
| refreshToken | String | Stored for server-side logout invalidation |
| createdAt | Date | Auto-managed by timestamps |
 
### Problems
| Field | Type | Purpose |
|---|---|---|
| title, slug | String | Display name + URL-friendly identifier |
| statement | String | Full problem description |
| difficulty | Enum | Easy / Medium / Hard |
| tags | String[] | e.g. Array, DP, Graph |
| examples | Array | Shown to users on problem page |
| testCases | Array | Hidden — select:false, only judge sees these |
| timeLimit | Number | Seconds allowed per test case |
| memoryLimit | Number | MB allowed |
| isPublished | Boolean | Unpublished problems only visible to admins |
 
### Submissions
| Field | Type | Purpose |
|---|---|---|
| userId | ObjectId | Reference to User who submitted |
| problemId | ObjectId | Reference to Problem |
| language | Enum | cpp / java / python / javascript |
| code | String | Full submitted code |
| verdict | Enum | Accepted / Wrong Answer / TLE / RE / CE / Pending |
| testCasesPassed | Number | How many test cases passed |
| runtime | Number | Max runtime in milliseconds |
| errorMessage | String | Compile or runtime error details |
 
### Contests
| Field | Type | Purpose |
|---|---|---|
| title, slug | String | Display name + URL |
| startTime, endTime | Date | Contest window |
| problems | Array | Problem refs with points + display order |
| registeredUsers | ObjectId[] | Users who registered |
| scoringMode | Enum | ACM (penalty time) or IOI (partial score) |
| isPublished | Boolean | Draft vs live |
 
### Contest Submissions
Same as regular Submissions plus:
| Field | Type | Purpose |
|---|---|---|
| contestId | ObjectId | Which contest this belongs to |
| pointsEarned | Number | Points awarded on acceptance |
| penaltyMinutes | Number | 20 min per wrong answer before AC (ACM mode) |
| solveTimeMinutes | Number | Minutes from contest start when accepted |
 
---
 
## API Documentation
 
### Auth
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login | No |
| POST | /api/auth/logout | Logout | No |
| POST | /api/auth/refresh | Get new access token | No (uses cookie) |
| GET | /api/auth/me | Get logged in user | Yes |
 
### Problems
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/problems | List all problems | No |
| GET | /api/problems/:slug | Get one problem | No |
| POST | /api/problems | Create problem | Admin only |
| PUT | /api/problems/:slug | Update problem | Admin only |
| DELETE | /api/problems/:slug | Delete problem | Admin only |
 
### Compiler
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/compiler/run | Run code with custom input | No |
 
### Submissions
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/submissions | Submit against hidden test cases | Yes |
| GET | /api/submissions | My submission history | Yes |
| GET | /api/submissions/:id | Single submission details | Yes |
 
### Contests
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/contests | List all contests | No |
| GET | /api/contests/:slug | Contest details | No |
| POST | /api/contests | Create contest | Admin only |
| POST | /api/contests/:slug/register | Register for contest | Yes |
| POST | /api/contests/:slug/submit | Submit in contest | Yes |
| GET | /api/contests/:slug/scoreboard | Live scoreboard | No |
| GET | /api/contests/:slug/my-submissions | My contest submissions | Yes |
 
### Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/dashboard/me | Personal stats | Yes |
| GET | /api/dashboard/leaderboard | Global leaderboard | No |
 
### AI
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/ai/review | Code review | Yes |
| POST | /api/ai/complexity | Complexity analysis | Yes |
| POST | /api/ai/hint | Get hint | Yes |
| POST | /api/ai/explain-wrong-answer | Wrong answer explanation | Yes |
| POST | /api/ai/explain-error | Error explanation | Yes |
| POST | /api/ai/generate-test-cases | Generate test cases | Yes |
| POST | /api/ai/dry-run | Dry run trace | Yes |
 
---
 
## Installation Guide
 
### Prerequisites
- Node.js 20+
- npm
- Git
- Docker (for code execution)
- MongoDB Atlas account (free at mongodb.com)
- Groq API key (free at console.groq.com)
### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```
 
### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
```
 
### 3. Frontend setup
```bash
cd frontend
npm install
```
 
### 4. Build Docker images
```bash
cd backend/docker
chmod +x build-images.sh
./build-images.sh
# Builds 4 images: cpp, java, python, javascript
# Takes 3-5 minutes first time
```
 
### 5. Run backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```
 
### 6. Run frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```
 
---
 
## Environment Variables
 
Create a `.env` file in the `backend/` folder:
 
| Variable | Example | What it does |
|---|---|---|
| `PORT` | `5000` | Port the server runs on |
| `NODE_ENV` | `development` | Affects cookie security and logging |
| `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | `random_string_here` | Signs access tokens — use a long random string |
| `JWT_REFRESH_SECRET` | `different_random_string` | Signs refresh tokens — must be different from access secret |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL — used for CORS whitelist |
| `GROQ_API_KEY` | `gsk_...` | Groq API key for all AI features |
| `EXECUTOR_MODE` | `local` or `docker` | Use `local` for development, `docker` for production |
 
---
 
## Docker Execution — Why and How
 
### Why Docker?
Without Docker, submitted code runs directly on your server. A user could submit `import os; os.system("rm -rf /")` and wipe your server. Docker prevents this by running each submission in a completely isolated environment.
 
### Security per container
```
--network none        -> No internet. Can't call external APIs or download anything.
--memory 256m         -> Hard memory cap. Memory bombs don't work.
--memory-swap 256m    -> No swap. Total memory truly capped at 256MB.
--pids-limit 64       -> Prevents fork bombs (processes can't multiply endlessly).
--cpus 1              -> Limited to 1 CPU core.
Read-only mounts      -> Code file and input file mounted as read-only.
```
 
### Infinite loop prevention — 3 layers
```
Layer 1: Linux 'timeout' command inside container
         Kills at exactly TIME_LIMIT seconds, returns exit code 124
 
Layer 2: Node.js exec() timeout option
         Kills the exec process if the container itself hangs
 
Layer 3: JavaScript setTimeout hard kill
         Catches edge cases where Docker daemon has issues
```
 
### Language images
| Language | Base Image |
|---|---|
| C++ | alpine:3.19 + g++ |
| Java | eclipse-temurin:17-jdk-alpine |
| Python | python:3.11-alpine |
| JavaScript | node:20-alpine |
 
---
 
## Deployment
 
### Frontend — Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Set Root Directory: `frontend`
4. Add env variable: `VITE_API_URL = https://solvora-cp.vercel.app/api`
5. Deploy — Vercel auto-deploys on every push to main
### Backend — AWS EC2
```bash
# On EC2 (Ubuntu)
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs docker.io nginx git
sudo npm install -g pm2
 
git clone YOUR_REPO
cd YOUR_REPO/backend
npm install
nano .env
 
# Build Docker images
cd docker && ./build-images.sh && cd ..
 
# Start with PM2
pm2 start server.js --name codearena-backend
pm2 startup && pm2 save
```
 
### Nginx config
```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
 
### Updating backend after code changes
```bash
ssh -i key.pem ubuntu@YOUR_EC2_IP
cd YOUR_REPO/backend
git pull origin main
npm install
pm2 restart codearena-backend
```
 
Frontend updates automatically on Vercel when you push to GitHub.
 
---
 
## Security Features
 
| Feature | Implementation |
|---|---|
| Password hashing | bcrypt with salt rounds 12 |
| JWT security | Short-lived access tokens (15min) + long refresh tokens (7d) |
| Cookie security | httpOnly, Secure, SameSite=Strict |
| Role verification | Every admin route fetches role fresh from DB — JWT role is never trusted |
| CORS | Only whitelisted origins can call the API |
| Security headers | Helmet.js — CSP, X-Frame-Options, HSTS |
| Rate limiting | 10 submissions per 10 minutes per user |
| Input validation | Code capped at 50KB, input at 10KB |
| XSS prevention | DOMPurify sanitizes problem statements |
| Code sandboxing | Full Docker isolation per submission |
| Infinite loop prevention | Triple-layer timeout system |
| Fork bomb prevention | --pids-limit 64 in Docker |
| Memory bomb prevention | --memory 256m --memory-swap 256m |
| Network isolation | --network none blocks all outbound traffic |
 
---
 
## Challenges Faced
 
**1. Docker stdin not receiving input**
Code that reads from stdin (like `input()` in Python) would hang forever because stdin was never closed. Fixed by mounting the input as a file and using shell redirection (`< /sandbox/input.txt`) inside the container instead of piping through Node.js.
 
**2. C++ binary disappearing between containers**
The compile step produced a binary in one Docker container, but the run step used a brand new container — binary was gone. Fixed by doing compile and run in a single `docker run` command using `&&` so both happen in the same container filesystem.
 
**3. Mixed Content (HTTP/HTTPS)**
Vercel frontend is HTTPS but EC2 backend was plain HTTP. Browsers block this. Fixed by using Vercel's rewrite rules to proxy all `/api/*` requests through Vercel itself — browser only talks to HTTPS.
 
**4. Nodemon restarting mid-execution**
When a code file was saved to `compiler/codes/`, nodemon detected the new `.py` or `.js` file and restarted the server mid-execution. Fixed by moving all temp files to the OS temp directory (`/tmp`) which nodemon never watches.
 
**5. JWT role escalation**
If role is stored in the JWT, someone could modify "user" to "admin" in the token payload. Fixed by never trusting the role from JWT — every protected route fetches the role fresh from MongoDB on every request.
 
---
 
## Future Improvements
 
- Real-time leaderboard using WebSockets
- Plagiarism detection using MOSS (Stanford)
- Email verification on signup
- Password reset via email
- Discussion forum under each problem
- Problem editorials after contest ends
- Redis caching for leaderboard and problems
- CI/CD pipeline with GitHub Actions
- Unit and integration tests
- Kubernetes for horizontal scaling
- Multiple test case groups with partial scoring
- Dark/Light theme toggle
- Notification system
---
 
## Contributing
 
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request
---
 
## License
 
MIT License — see [LICENSE](LICENSE) for details.
 
---
 
## Author
 
**Neha Yadav**
 
| | |
|---|---|
| LinkedIn | [My LinkedIn](https://www.linkedin.com/in/neha-yadav-959302314/) |
| GitHub | [My GitHub](https://github.com/nehayadav827) |

---
 
*Built during Co-op Internship at AlgoUniversity (Y Combinator backed)*