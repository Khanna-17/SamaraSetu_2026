# Code Translation Arena - Full Stack Platform

A real-time coding challenge platform where each participant translates one random Python program into C, C++, Java, or JavaScript.

## Architecture

- frontend: React + Vite + Tailwind + Monaco Editor
- backend: Node.js + Express + Socket.IO
- data store: in-memory per running backend session
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
- In-memory runtime tuned for small event-style concurrent usage

## Folder Structure

- frontend
- backend

## Setup

1. Create env files

- Copy backend/.env.example to backend/.env and fill real keys.
- Copy frontend/.env.example to frontend/.env.

2. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

3. Run locally

```bash
npm start
```

4. Open app

- Participant: http://localhost:5173
- Admin: http://localhost:5173/admin

## Environment Variables

### Backend

- PORT
- NODE_ENV
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

### Frontend

- VITE_API_URL
- VITE_SOCKET_URL

## Deployment

### Render Blueprint: Frontend + Backend

- The root `render.yaml` defines:
  - a static site for `frontend`
  - a web service for `backend`
- Sync the Blueprint from the repo root in Render.
- Set backend env vars in the Render dashboard for the backend service.
- Set frontend env vars in the Render dashboard for the frontend static site:
  - `VITE_API_URL` = your backend URL + `/api`
  - `VITE_SOCKET_URL` = your backend URL
- Update backend `FRONTEND_URL` to your deployed frontend URL.

## Notes for Production

- This app currently stores contest state in memory, so restarting the backend clears sessions and results.
- A single backend instance is generally fine for an event-sized batch around 50 concurrent users.
- Use a paid Judge0/OpenAI tier for stable API throughput.
- Consider queue-based evaluation worker for heavy spikes.
- Add HTTPS and stronger admin auth before real exam usage.

## Default Admin

Set in backend env:

- ADMIN_USERNAME
- ADMIN_PASSWORD

Do not keep default credentials in production.
