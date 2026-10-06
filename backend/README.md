# Backend

## Setup

```sh
npm install
cp .env.example .env
npm run prisma:validate
npm run start:dev
```

`DATABASE_URL` must point to a PostgreSQL database. The example uses port 55435 to avoid other local projects. Set a local password in the ignored `.env` file, create the `storyscape` database, then run `npx prisma migrate dev` to apply migrations. No PostgreSQL installation or container is bundled with this repository.

On the development machine used for this setup, an isolated PostgreSQL 17 cluster lives in the ignored `backend/.local-postgres/data` directory. With PostgreSQL tools on `PATH`, start it from `backend/` with:

```sh
pg_ctl -D .local-postgres/data -l .local-postgres/server.log -o '-p 55435 -h 127.0.0.1' -w start
```

Its password is in the ignored local `.env`; neither the password nor database files are committed. On another machine, provide your own PostgreSQL instance and update `.env` accordingly.

The health endpoint is `http://localhost:3000/health`; it reports API and database availability separately. Swagger UI is at `http://localhost:3000/api`.

## Teacher authentication

Set `JWT_SECRET` in the ignored `.env` file to a random value of at least 32 bytes (for example, generate one with `openssl rand -base64 48`). The API refuses to start without it. In local HTTP development, use `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax`. Set `COOKIE_SECURE=true` when serving the API over HTTPS in production. `CORS_ORIGIN` must be the exact teacher PWA origin.

To create or update a development professor, set `SEED_PROFESSOR_EMAIL` and `SEED_PROFESSOR_PASSWORD` in the ignored `.env` file, then run:

```sh
npm run seed:professor
```

The seed is explicit and stores only an Argon2id hash. Remove the seed variables from `.env` when they are no longer needed. There is no public registration endpoint.

With the API running and a seed professor available, `npm run test:auth` checks the authentication flow without printing credentials or tokens.

`POST /auth/login` sets an HttpOnly cookie and returns `{ id, email }`. `GET /auth/me` validates that cookie. `POST /auth/logout` clears it. The cookie is valid until its JWT expires; this MVP does not revoke already issued JWTs server-side.
