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

Backend runs on http://localhost:3001  
Frontend runs on http://localhost:5173 (dev) or http://localhost:80 (Docker)

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
