# StoryScape Platform

This repository contains the academic tracking backend and the teacher PWA.

## Projects

- `backend`: NestJS REST API and Prisma configuration for PostgreSQL.
- `teacher-pwa`: React/Vite teacher PWA.

Each project has its own dependencies and environment file. See the project READMEs for setup commands.

## Quick start (portal + Unity demo)

1. **Backend**: follow `backend/README.md` (PostgreSQL, `.env`, `npx prisma migrate dev`, `npm run seed:professor`, `npm run start:dev`). Add `UNITY_INGEST_KEY` and `UNITY_PROFESSOR_EMAIL` to `.env`.
2. **Teacher PWA**: follow `teacher-pwa/README.md` (`cp .env.example .env`, `npm run dev`) and log in with the seed professor.
3. **Unity**: copy the same key into `portal.local.json` of the Unity repo (see its README, "Portal del docente").
4. Optional: `cd backend && npm run seed:demo` to load example students.

If port 3000 or 5173 are taken, change `PORT` / `VITE_API_BASE_URL` / `CORS_ORIGIN` consistently (the PWA origin must match `CORS_ORIGIN` exactly).
