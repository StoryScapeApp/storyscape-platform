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
