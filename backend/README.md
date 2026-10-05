# Backend

## Setup

```sh
npm install
cp .env.example .env
npm run prisma:validate
npm run start:dev
```

`DATABASE_URL` must point to a PostgreSQL database before database commands that connect to it are used. The current Prisma schema intentionally has no models or migrations. The API does not connect to PostgreSQL until database features are implemented.

The health endpoint is `http://localhost:3000/health`; Swagger UI is at `http://localhost:3000/api`.
