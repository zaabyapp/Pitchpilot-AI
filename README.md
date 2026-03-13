# PitchPilot AI

**Real-time AI pitch coach powered by Gemini Live API.**  
Practice your pitch, get challenged with hard questions, and receive instant feedback — all through a live voice conversation.

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) by Google.

🌐 **Live Demo:** [pitchpilot-ai.vercel.app](https://pitchpilot-ai.vercel.app)  
📦 **Repo:** [github.com/zaabyapp/Pitchpilot-AI](https://github.com/zaabyapp/Pitchpilot-AI)

---

## What It Does

PitchPilot AI puts you in a real pitch simulation before the real thing.

Choose your audience — investor, teacher, customer, conference — and the AI agent adapts its role and questions accordingly. After your pitch, it challenges you with 3–4 tough follow-up questions, then gives you concise coaching feedback and a detailed report.

**Two modes:**
- **Practice Pitch** — Full simulation: onboarding → 45s pitch → Q&A → coaching feedback → report
- **Coach Chat** — Open conversation with your AI coach, share your screen, ask anything about your project

---

## Key Features

- 🎙️ **Live voice conversation** — Real-time bidirectional audio via Gemini Live API
- 🖥️ **Optional screen sharing** — Share slides, demos, or docs as visual pitch context
- 🎭 **Adaptive simulation** — Agent plays investor, teacher, customer, or any audience you specify
- ❓ **Dynamic Q&A** — 3–4 challenging questions based on what you actually said
- 📊 **Detailed report** — Score, delivery metrics, sentiment analysis, action items
- 📄 **PDF export** — Download your full feedback report
- 🌐 **Bilingual** — Full English and Spanish support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Backend | Node.js + Express + TypeScript |
| AI | Gemini Live API (`gemini-2.5-flash-native-audio-preview`) |
| Real-time | WebSocket (bidirectional audio proxy) |
| Cloud | Google Cloud Run |
| Frontend Hosting | Vercel |
| Audio/Video | WebRTC + Web Audio API + getDisplayMedia |

---

## Architecture

```
[Browser]
  ├── Microphone (PCM 16kHz) ──────────────────────────┐
  ├── Screen Share (JPEG frames, every 15s) ────────────┤
  └── Playback (PCM 24kHz) ◄──────────────────────────┐│
                                                        ││
[Backend — Google Cloud Run]                            ││
  ├── WebSocket proxy ◄──────────────────────────────── ┘│
  ├── Phase/state machine (onboarding → pitch → Q&A → coaching)
  ├── Report generation ──► Gemini text API             │
  └── Gemini Live API WebSocket ◄──────────────────────── ┘

[Gemini Live API]
  └── gemini-2.5-flash-native-audio-preview
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Gemini API key ([get one here](https://aistudio.google.com/apikey))
- Microphone access in browser

### 1. Clone the repo
```bash
git clone https://github.com/zaabyapp/Pitchpilot-AI.git
cd Pitchpilot-AI
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

### 3. Setup Frontend
```bash
# In a new terminal
cd frontend
npm install
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

---

## Environment Variables

**Backend (`backend/.env`):**
```
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend (`frontend/.env.development`):**
```
REACT_APP_BACKEND_URL=http://localhost:3001
```

---

## Cloud Deployment

Backend is deployed on **Google Cloud Run**.

```bash
# Make sure Docker is running
chmod +x deploy.sh
./deploy.sh
```

Frontend is deployed on **Vercel**:
```bash
cd frontend
npm run build
vercel --prod
```

---

## Project Structure

```
Pitchpilot-AI/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── voice.websocket.ts   ← Gemini Live proxy + report generation
│   │   ├── routes/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── deploy.sh
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PitchRecorder.jsx    ← Main session UI + state machine
│   │   │   ├── FeedbackReport.jsx   ← Report + PDF export
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useVoiceSession.js   ← Audio capture + WebSocket
│   │   │   └── useScreenShare.js    ← Screen share + frame capture
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## How It Works

1. **Select language** (English / Spanish) and **mode** (Practice Pitch / Coach Chat)
2. **Onboarding** — Agent asks 2–3 questions to understand your audience and scenario
3. **Pitch** — 45-second target window (soft limit, you can keep going)
4. **Q&A** — Agent plays your audience and asks 3–4 challenging follow-up questions
5. **Coaching** — Live feedback on content, delivery, and screen context
6. **Report** — Full analysis with score, metrics, action items, exportable as PDF

---

## Learnings

- Gemini Live API's native audio model handles real-time bidirectional voice with surprisingly low latency when VAD is tuned correctly
- Screen share as pitch context (via `getDisplayMedia` + periodic JPEG frames) opens up a genuinely new coaching use case
- Separating the report snapshot from post-simulation chat is critical — the boundary between "what gets graded" and "free coaching" needs to be explicit in both code and prompt design
- Prompt engineering for voice agents is fundamentally different from text — conciseness and avoiding meta-commentary are critical

---

## Authors

Built with 🤍 by **Gaby** and **Donato**

---

## License

MIT
