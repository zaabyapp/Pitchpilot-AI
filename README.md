#PitchPilot AI

**AI Pitch Coach for Builders** — An interactive live AI agent that helps you practice pitching your product using real-time voice, video, and conversational feedback.

**Built for:** Gemini Live Agent Challenge by Google

## Overview

PitchPilot AI simulates real pitch scenarios where you can practice:
- Explaining your product to investors
- Pitching to potential users
- Presenting at conferences or demo days

The AI agent asks challenging questions in real-time, analyzes your video and body language, and provides detailed feedback to help you improve.

## Tech Stack

- **Frontend:** React 18
- **Backend:** Node.js + Express + TypeScript
- **AI:** Gemini Live API
- **Cloud:** Google Cloud Run
- **Audio/Video:** WebRTC + Browser Media APIs

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud Project with Gemini API enabled
- Microphone and camera access

### Setup Instructions

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd PitchPilotAI
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys and configuration
npm run dev
```

3. **Setup Frontend (in new terminal)**
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

4. **Open in Browser**
```
http://localhost:3000
```

## Project Structure

```
PitchPilotAI/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── middleware/
│   │   ├── index.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── public/
│   └── package.json
│
└── README.md
```

## Development Timeline

- **Days 1-2:** Gemini Live API integration + WebSocket setup
- **Days 3-4:** Conversational agent logic + Video analysis
- **Days 5-6:** Feedback generation + Report UI
- **Days 7-8:** Google Cloud deployment
- **Days 9-11:** Refinement + Demo + Submission

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/pitch/start` - Initialize new pitch session
- `GET /api/pitch/session/:sessionId` - Get session details
- `POST /api/pitch/feedback` - Generate feedback (WIP)
- `GET /api/pitch/report/:sessionId` - Get report (WIP)

## Contributing

This is a hackathon project. Contributions are welcome!

## License

MIT
