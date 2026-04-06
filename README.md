# Code Translation Arena - Full Stack MERN Platform

A real-time coding challenge platform where each participant translates one random Python program into C, C++, Java, or JavaScript.

## Architecture

- client: React + Vite + Tailwind + Monaco Editor
- server: Node.js + Express + Mongoose + Socket.IO
- database: MongoDB
- execution: Judge0 API
- AI evaluation: OpenAI API

## Features Implemented

- Student entry with name and roll number validation
- Fair random question allocation from 30 seeded questions
- Split-screen game UI with read-only Python source + editable target editor
- Language selector (C, C++, Java, JavaScript)
- Auto-start timer and time tracking
- Auto-save every 5 seconds and resume session support
- Judge0 hidden-test execution and accuracy score
- OpenAI AI-based logic/code evaluation
- Final weighted score: (accuracy * 0.5) + (ai * 0.4) + (time * 0.1)
- Partial scoring even for incomplete attempts
- Compile/runtime error capture
- Animated result page with score breakdown and feedback
- Real-time leaderboard via Socket.IO
- Admin login and dashboard
- Participants table + analytics + participant detail drill-down
- Add/edit/delete/reset question controls
- CSV export of results
- Dark cyberpunk neon UI with glassmorphism, particles, and animated transitions
- Security basics: request validation, rate limiting, code length limit, Helmet, CORS
- Mongo connection pool tuned for concurrent usage

## Folder Structure

- client
- server

## Setup

1. Create env files

- Copy server/.env.example to server/.env and fill real keys.
- Copy client/.env.example to client/.env.

2. Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

3. Run locally (two terminals)

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

4. Open app

- Participant: http://localhost:5173
- Admin: http://localhost:5173/admin

## Environment Variables

### Server

- PORT
- NODE_ENV
- MONGO_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- ADMIN_USERNAME
- ADMIN_PASSWORD
- JUDGE0_BASE_URL
- JUDGE0_API_KEY
- OPENAI_API_KEY
- OPENAI_MODEL
- FRONTEND_URL
- MAX_CODE_LENGTH

### Client

- VITE_API_URL
- VITE_SOCKET_URL

## Deployment

### Option A: Render (Server) + Vercel (Client)

- Render server config file is included: server/render.yaml
- Deploy server root as server folder.
- Add all server env variables in Render dashboard.
- Deploy client to Vercel from client folder.
- Set client env:
  - VITE_API_URL = your deployed server URL + /api
  - VITE_SOCKET_URL = your deployed server URL
- Update server FRONTEND_URL to your deployed client URL.

### Option B: Railway (Server)

- Deploy server folder directly.
- Set same server env vars.
- Deploy client separately on Vercel/Netlify.

## Notes for Production

- For 50 concurrent users, keep Mongo pool maxPoolSize >= 50 (already set).
- Use a paid Judge0/OpenAI tier for stable API throughput.
- Consider queue-based evaluation worker for heavy spikes.
- Add HTTPS and stronger admin auth before real exam usage.

## Default Admin

Set in server env:

- ADMIN_USERNAME
- ADMIN_PASSWORD

Do not keep default credentials in production.
