# Running Weather Project

This guide is just for getting the project running on your machine. For
architecture and design decisions see [`README.md`](./README.md); for the

There are two paths:

- **A. Docker** (recommended) — one command, no Node or Mongo installed locally.
- **B. Local Node** — for active development with hot reload.

---

## Prerequisites

| Tool | Version | Path A (Docker) | Path B (local) |
| --- | --- | --- | --- |
| Docker | 24+ | ✅ required | — |
| Docker Compose | v2 (`docker compose`) | ✅ required | — |
| Node.js | 20+ | — | ✅ required |
| npm | 10+ | — | ✅ required |
| MongoDB | 7+ | — | ✅ required (or use the compose-managed one) |

**One thing you always need:** a free OpenWeather API key.
Get one at <https://home.openweathermap.org/api_keys> — it activates within
a few minutes of account creation.

---

## Path A — Docker (recommended)

Four steps from a fresh clone to a running app.

```bash
# 1. Clone the repo
git clone https://github.com/edmorua/weather-project weather-project
cd weather-project

# 2. Copy the env file and set your OpenWeather key
cp .env.example .env
# Open .env in your editor and set:
#   OPENWEATHER_API_KEY=your-actual-key-from-openweather

# 3. Build and start everything (Mongo + API + Web)
docker compose --env-file .env up --build

# 4. Open the apps in your browser
#    Web app:  http://localhost:8080
#    Swagger:  http://localhost:3001/api/docs
#    Health:   http://localhost:3001/health
```

**To stop:** `Ctrl+C` in the terminal, then `docker compose down` to remove
containers. Add `-v` (`docker compose down -v`) to also wipe the Mongo
volume.

**To rebuild after code changes:**

```bash
docker compose --env-file .env up --build
```

---

## Path B — Local development (no containers)

Use this if you want hot reload while editing code.

```bash
# 1. Install dependencies (root + both workspaces in one go)
npm install

# 2. Copy and edit the env file
cp .env.example .env
# Set OPENWEATHER_API_KEY in .env

# 3. Start MongoDB
#    Option a) Run only the Mongo container from compose:
docker compose --env-file .env up mongo -d
#    Option b) Or run a Mongo you already have locally on :27017

# 4. Start the API and web app together
npm run dev
#    API:  http://localhost:3001
#    Web:  http://localhost:5173
```

Or run them separately in two terminals:

```bash
npm run dev:api    # NestJS in watch mode (rebuilds on .ts changes)
npm run dev:web    # Vite dev server (HMR)
```

---

## Verifying it works

After the apps boot, run these checks:

```bash
# 1. Health check — should return {"status":"ok"} with mongo healthy
curl http://localhost:3001/health

# 2. Weather endpoint — should return a JSON report
curl 'http://localhost:3001/api/v1/weather?q=Charleston,SC&units=imperial'

# 3. Hit it again — `"cached": true` proves the Mongo cache is working
curl 'http://localhost:3001/api/v1/weather?q=Charleston,SC&units=imperial'

# 4. Trending analytics — should list Charleston with count >= 2
curl 'http://localhost:3001/api/v1/analytics/popular-locations'
```

In the browser:

1. Open `http://localhost:8080` (Docker) or `http://localhost:5173` (local dev).
2. Type a city in the search box, press **Search**.
3. You should see current conditions, a 24-hour forecast strip, and a 5-day forecast.
4. Click **Trending** in the nav — your city should appear in the list.
5. Open `http://localhost:3001/api/docs` — Swagger UI lists every endpoint.

---

## Running the tests

```bash
# Backend unit tests (Jest)
npm test --workspace apps/api

# Backend e2e tests (uses an in-memory Mongo, no external services)
npm run test:e2e --workspace apps/api

# Frontend unit tests (Vitest + React Testing Library)
npm test --workspace apps/web

# Frontend e2e tests (Cypress headless, against the built preview server)
npm --workspace apps/web run build
npm --workspace apps/web run preview &   # starts http://localhost:4173
npm --workspace apps/web run cypress:run
kill %1                                   # stop the preview server
```

All tests are self-contained — none of them call the real OpenWeather API.

---

## Troubleshooting

### `OPENWEATHER_API_KEY` is missing

The API refuses to boot if the key isn't set:

```
Error: Invalid environment configuration: OPENWEATHER_API_KEY must be a string
```

Fix: edit `.env` and set the key, then restart.

### Newly-created OpenWeather keys take a few minutes to activate

You'll see `401` or `403` responses while the key is still propagating.
Wait ~10 minutes after sign-up. The API masks these as
`503 Service Unavailable` for security — check the container logs
(`docker compose logs api`) to confirm it's an auth error.

### Port already in use

The defaults are `3001` (API), `8080` (Docker web), `5173` (local web),
`27017` (Mongo). If one is taken:

- **Docker:** edit `docker-compose.yml` and change the host-side port
  (e.g. `'3002:3001'`).
- **Local:** override via env vars before starting:
  ```bash
  API_PORT=3002 npm run dev:api
  ```

### Mongo connection refused on local dev

Make sure Mongo is running. The quickest fix is to use the compose-managed one:

```bash
docker compose --env-file .env up mongo -d
```

Then check `MONGO_URI` in `.env` matches `mongodb://localhost:27017/palmetto-weather`.

### CORS error in the browser

The API allows `http://localhost:5173` by default (the Vite dev server).
If you run the web app on a different host or port, set `CORS_ORIGIN`
in `.env` and restart the API.

### Stale Docker build after changes

```bash
docker compose down -v        # remove containers + Mongo volume
docker compose --env-file .env up --build --force-recreate
```

### Cached weather looks wrong

The cache TTL is 10 minutes (`WEATHER_CACHE_TTL_SECONDS=600`). To force a
fresh fetch sooner, drop the cache collection:

```bash
docker compose exec mongo mongosh palmetto-weather --eval 'db.cache_entries.drop()'
```

---

## Useful commands cheat sheet

```bash
# Logs
docker compose logs -f api      # follow API logs
docker compose logs -f web      # follow web container logs
docker compose logs -f mongo

# Open a Mongo shell against the compose container
docker compose exec mongo mongosh palmetto-weather

# List collections
docker compose exec mongo mongosh palmetto-weather --eval 'db.getCollectionNames()'

# See the cache contents (will be empty if nothing was searched yet)
docker compose exec mongo mongosh palmetto-weather --eval 'db.cache_entries.find().pretty()'

# See recorded analytics events
docker compose exec mongo mongosh palmetto-weather --eval 'db.search_events.find().sort({createdAt:-1}).limit(5).pretty()'

# Rebuild just the API image
docker compose build api
docker compose up -d api

# Tear everything down (and wipe the Mongo volume)
docker compose down -v
```

---

## What's running where (default ports)

| Service | URL | Path A (Docker) | Path B (local) |
| --- | --- | --- | --- |
| Web app | `/` | `http://localhost:8080` | `http://localhost:5173` |
| API base | `/api/v1` | `http://localhost:3001/api/v1` | `http://localhost:3001/api/v1` |
| Swagger UI | `/api/docs` | `http://localhost:3001/api/docs` | `http://localhost:3001/api/docs` |
| Health probe | `/health` | `http://localhost:3001/health` | `http://localhost:3001/health` |
| MongoDB | `:27017` | exposed on host | local install or compose |
