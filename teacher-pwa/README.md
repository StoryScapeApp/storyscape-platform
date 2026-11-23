# Teacher PWA

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. Set `VITE_API_BASE_URL` to the backend origin, and set that exact PWA origin as `CORS_ORIGIN` in the backend. Authentication uses an HttpOnly cookie sent with `credentials: 'include'`; no JWT is stored in browser JavaScript storage. Pages (Spanish UI, El Principito theme): Panel, Estudiantes, Detalle de estudiante/sesión and Progreso, all behind authentication. `npm run build` generates the static PWA and service worker in `dist/`.

With the backend, PWA dev server, and development professor running, `npm run test:auth` runs the browser flow in an installed Chrome using Playwright Core. Set `CHROME_PATH` if Chrome is installed elsewhere.
