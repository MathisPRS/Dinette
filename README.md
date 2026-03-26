# Dinette – Recipe Management App

A mobile-first recipe management web application built with:

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT
- **Deployment:** Docker Compose

## Development

```bash
cp .env.example .env
# Edit .env with your values
docker compose up --build
```

The environment file must be created at the project root:

```bash
Dinette/.env
```

`docker compose` reads this root `.env` file for both build args and container environment variables.

Backend runs on http://localhost:3001  
Frontend runs on http://localhost:5173 (dev) or http://localhost:80 (Docker)

## Deployment Notes

- Set `FRONTEND_URL` to your public URL, for example `https://dinette.example.com`
- Set `CORS_ORIGINS` to the comma-separated list of allowed frontend origins
- Set `WEBAUTHN_RP_ID` to your public domain without protocol
- Set `WEBAUTHN_ORIGINS` to the HTTPS origins allowed for Face ID / passkeys
- Keep `VITE_API_URL` empty if frontend and API are served from the same domain behind the reverse proxy

### Seed behavior

- `seed.ts` runs on every container start, but test user and demo recipes are now controlled by env vars
- Default behavior: enabled outside production, disabled in production
- `seed-ingredients.ts` still runs on every start and skips work if the ingredient table is already populated and translated

## Structure

```
dinette/
├── backend/     Express API
├── frontend/    React + Vite SPA
└── docker-compose.yml
```


## Ideas you can ADD :
- Ajout Suggestion en recupérant un API externe
- 
