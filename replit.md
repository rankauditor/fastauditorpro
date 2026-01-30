# Call Audit Application

## Overview
This is a full-stack Node.js/React application for auditing call recordings. It uses:
- **Backend**: Express.js with TypeScript, running on port 5000
- **Frontend**: React with Vite, TailwindCSS, and Radix UI components
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API via Replit AI Integrations for audio transcription and analysis

## Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── main.tsx      # Entry point
│   └── index.html
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   ├── vite.ts           # Vite middleware for development
│   ├── static.ts         # Static file serving for production
│   └── replit_integrations/  # AI integration modules
│       ├── audio/        # Audio processing utilities
│       ├── batch/        # Batch processing utilities
│       ├── chat/         # Chat functionality
│       └── image/        # Image generation
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Drizzle database schema
│   └── routes.ts         # API route definitions
└── script/               # Build scripts
```

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run db:push` - Push database schema changes

## Database Schema
The main table is `calls` which stores:
- `id`: Primary key
- `filename`: Uploaded audio file name
- `duration`: Call duration
- `status`: Processing status (uploading, transcribing, auditing, completed, failed)
- `transcript`: Transcribed text
- `auditResult`: JSON audit results
- `createdAt`: Timestamp

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (auto-configured by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL (auto-configured by Replit)

## Features

### Settings Page (/settings)
Configurable quality criteria for call audits:
- **Categories**: Group questions into logical categories (Opening, Discovery, Compliance, etc.)
- **Questions**: Each with text, weight (1-10), and mandatory flag
- **Scoring Rules**: Pass threshold, fail on mandatory toggle, partial scoring toggle
- API endpoints: `GET/PUT /api/settings`, `POST /api/settings/reset`

### Multi-File Upload with Queue
- Upload multiple audio files at once
- Sequential processing (one file at a time) 
- Real-time status updates (pending, processing, done, failed)
- API endpoints: `GET /api/queue`, `POST /api/queue/add`

### Customer Intent Detection
- Automatically classifies customer intent from call transcripts
- Categories: Interested, Not Interested, Needs Follow-Up, Price Concern, Just Researching, Wrong Contact
- Displays intent, confidence level (Low/Medium/High), and supporting evidence
- Separate from scoring - informational only, does not affect pass/fail verdict
- Implementation: `server/services/intent.ts`

## Development Notes
- The server binds to 0.0.0.0:5000 for Replit compatibility
- Vite handles frontend HMR in development mode
- In production, static files are served from `dist/public`
- Settings are stored in-memory (server/settings.ts) for quick prototyping
- Queue uses sequential processing with buffer management (server/queue.ts)
