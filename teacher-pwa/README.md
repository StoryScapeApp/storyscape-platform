# Teacher PWA

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. Set `VITE_API_BASE_URL` to the backend origin. The pages are placeholders and do not call the API yet. `npm run build` generates the static PWA and service worker in `dist/`.
