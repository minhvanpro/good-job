# GoodJob - Employee Recognition Platform

A full-stack employee recognition platform where team members can send Kudos (praise points) to each other, redeem rewards, and maintain engagement through real-time notifications.

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache/Queue**: Redis (Bull queue for video processing, Redis adapter for Socket.IO)
- **Auth**: JWT (bcryptjs for password hashing)
- **Validation**: Zod
- **Real-time**: Socket.IO
- **File Upload**: Cloudinary (image/video hosting)
- **Scheduling**: node-cron (monthly budget reset)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: MUI (Material-UI v6)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Real-time**: Socket.IO client

### Infrastructure
- **Containerization**: Docker Compose (PostgreSQL + Redis)
- **CI/CD**: GitHub Actions (lint, type-check, test, deploy)

## Architecture Decisions

### Why PostgreSQL?
- Relational integrity for complex queries (user budgets, point ledgers, redemptions)
- Prisma ORM provides type-safe database access
- ACID compliance for financial transactions (point transfers)

### Why Redis?
- Bull queue for async video processing (transcoding, thumbnail generation)
- Socket.IO adapter for horizontal scaling of WebSocket connections
- Rate limiting store

### Why Zustand over Redux?
- Minimal boilerplate for global auth state
- Built-in TypeScript support without extra setup
- Lightweight (~1KB) — sufficient for this app's state complexity

### Why Monorepo without a tool?
- Simple project with clear separation (backend/ + frontend/)
- Shared types can be duplicated (no need for a shared package)
- Docker Compose handles service orchestration

## Project Structure

```
good-job/
├── backend/
│   ├── prisma/
│   │   ├── migrations/       # Database migrations
│   │   └── schema.prisma     # Database schema
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, kudos, rewards, etc.)
│   │   ├── middleware/        # Auth, rate limiter, error handler
│   │   ├── services/         # Business logic (kudoService, rewardService, etc.)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── db/               # Seed script
│   │   └── index.ts          # Express app entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages (Login, Feed, SendKudo, etc.)
│   │   ├── services/         # API client (Axios)
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript interfaces
│   │   └── constants.ts      # Shared constants
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js >= 18
- Docker Desktop (for PostgreSQL + Redis)

### 1. Clone & Install

```bash
git clone <repo-url>
cd good-job

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Cloudinary credentials (or leave defaults for local dev)
```

### 3. Start Infrastructure (Docker)

```bash
docker compose up -d postgres redis
```

### 4. Database Setup

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend (port 4000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Visit **http://localhost:5173** — the Vite dev server proxies `/api` requests to the backend.

### 6. Docker (Full Stack)

```bash
docker compose up --build
```

This starts all services: PostgreSQL, Redis, Backend (port 4000), Frontend (port 3000).

## Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled JS |
| `npm run migrate` | Apply Prisma migrations |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run tests |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
