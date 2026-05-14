# Weather Project

A production-grade weather application built for the Palmetto take-home challenge.
A React SPA prompts for a location; a NestJS API returns a normalized weather
report — current conditions, hourly + daily forecasts, and derived advisories —
backed by OpenWeather and a MongoDB TTL response cache. A small anonymous
analytics module exposes a "trending locations" endpoint.

> **Just want to run it?** See [`RUNNING.md`](./RUNNING.md) for the four-step
> Docker setup, local-dev instructions, verification commands, and
> troubleshooting.

## Why this stack

| Concern | Choice | Reason |
| --- | --- | --- |
| API framework | **NestJS** | Module/DI structure scales, native Swagger + class-validator integration. |
| Frontend | **Vite + React + TS** | Fast DX, simple SPA fit for a focused weather UI. |
| Database | **MongoDB (Mongoose)** | Doubles as TTL response cache and analytics store; aligns with Palmetto's stack. |
| Weather provider | **OpenWeather (direct `fetch`)** | Free tier, current + 5-day forecast + geocoding. Called over native `fetch` — no SDK wrapper, per the challenge rules. |
| State | **TanStack Query** | Server-state caching, retries, stale-while-revalidate. |
| Validation | **class-validator (API)** | Strict input validation on the wire boundary. |
| Testing | **Jest + supertest + mongodb-memory-server (API)**, **Vitest + RTL + Cypress (web)** | Unit, integration and E2E coverage with no external services. |
| Logging | **Winston (JSON)** | Structured logs with correlation IDs flowing through error responses. |
| Observability | **`/health` (Terminus)** | Liveness + Mongo readiness probe for orchestrators. |
| Rate limiting | **`@nestjs/throttler`** | Per-IP throttling to protect upstream OpenWeather quota. |
| CI | **GitHub Actions** | Lint → test → build → Docker, plus a separate Cypress workflow. |

> **A note on scope.** The challenge asks for a weather app. We deliberately
> avoided shipping authentication, user accounts, favorites or saved-history
> features — they would have doubled the codebase without addressing any
> rubric item, and "setup matters" is an explicit evaluation criterion. The
> popular-locations analytics endpoint provides "business logic beyond
> proxying" without requiring user accounts.

## What's in the box

- **OpenWeather integration** via native `fetch`, with timeout, 4xx/5xx → domain-exception mapping, and structured logging.
- **Mongo-backed TTL cache** — Mongo evicts expired entries automatically via the `expireAfterSeconds: 0` index; no cron required.
- **Derived business logic** — `deriveAdvisories()` turns raw numbers into actionable warnings (heat, cold, wind, rain, low-visibility), unit-aware.
- **Anonymous popular-locations analytics** — Mongo aggregation over `search_events`, served via `/api/v1/analytics/popular-locations`.
- **Swagger / OpenAPI** at `/api/docs`.
- **Global exception filter** with a consistent error envelope and `x-correlation-id` response header.
- **Helmet + CORS + rate limiting** baked in.
- **Docker Compose** stack — `mongo`, `api`, `web` — one command to a working environment.
- **GitHub Actions** workflows for unit/E2E tests, image builds and Cypress.

## Quick start (≤ 4 steps)

```bash
# 1. Clone
git clone https://github.com/edmorua/weather-project weather-project && cd weather-project

# 2. Copy env and add your free OpenWeather key (https://home.openweathermap.org/api_keys)
cp .env.example .env
$EDITOR .env  # set OPENWEATHER_API_KEY

# 3. Boot everything via Docker (Mongo + API + Web)
docker compose --env-file .env up --build

# 4. Open the apps
#    Web:     http://localhost:8080
#    API:     http://localhost:3001/api/v1
#    Swagger: http://localhost:3001/api/docs
#    Health:  http://localhost:3001/health
```

That's the whole setup. No global tooling beyond Docker.

## Local development (no containers)

```bash
# Requires Node 20+, npm 10+, and a local MongoDB (or use the compose mongo).
npm install
cp .env.example .env  # set OPENWEATHER_API_KEY

# Run API + Web concurrently:
npm run dev

# Or individually:
npm run dev:api   # NestJS, watch mode
npm run dev:web   # Vite, http://localhost:5173
```

## Testing

```bash
# API: unit + e2e (uses mongodb-memory-server, no real DB needed)
npm test --workspace apps/api
npm run test:e2e --workspace apps/api

# Web: Vitest unit / RTL component tests
npm test --workspace apps/web

# Web: Cypress E2E against the built preview (api calls are mocked via cy.intercept)
npm --workspace apps/web run build
npm --workspace apps/web run preview &
npm --workspace apps/web run cypress:run
```

CI runs all of the above on every PR — see `.github/workflows/`.

## Project layout

```
palmetto-weather/
├── apps/
│   ├── api/                NestJS service
│   │   ├── src/
│   │   │   ├── common/        Filters, interceptors
│   │   │   ├── config/        Typed configuration + env validation
│   │   │   ├── weather/       Core API: provider, transform, service, controller
│   │   │   │   ├── providers/openweather.provider.ts  ← native fetch, no SDK
│   │   │   │   └── domain/weather.transform.ts        ← maps + derives advisories
│   │   │   ├── cache/         Mongo TTL response cache
│   │   │   ├── analytics/     Anonymous search-event aggregation
│   │   │   └── health/        Terminus liveness + Mongo readiness
│   │   └── test/            E2E specs (supertest)
│   └── web/                 Vite + React SPA
│       ├── src/
│       │   ├── components/    Layout
│       │   ├── features/
│       │   │   ├── weather/   Search form, conditions card, forecast strips, advisories
│       │   │   └── analytics/ Trending-locations page
│       │   └── lib/          API client (axios), env
│       └── cypress/e2e/      Cypress specs
├── docker-compose.yml
├── .github/workflows/        CI (unit/E2E/build) + Cypress
└── README.md
```

## Architectural decisions

### "Scalable API architecture"

- **Provider abstraction** — `WeatherProvider` interface (`apps/api/src/weather/providers/openweather.provider.ts`) decouples the rest of the app from OpenWeather. Swapping to AccuWeather or weather.gov means writing one class.
- **Decoupled domain types** — `weather.types.ts` is the contract the frontend depends on. The mapping layer (`weather.transform.ts`) is the only thing that knows OpenWeather's shape.
- **Versioned URIs** — `app.enableVersioning({ type: URI, defaultVersion: '1' })` so v2 endpoints can ship without breaking v1 clients.
- **Module boundaries** — each feature (weather, cache, analytics, health) is its own Nest module exposing services rather than internals. Swapping the cache from Mongo to Redis is a `CacheModule` rewrite; no callers change.
- **Stateless API + shared Mongo cache** — horizontally scalable behind any load balancer.

### Error handling

- **Frontend** — TanStack Query handles retry/backoff; React Query errors render an inline alert; `describeError()` extracts a human-readable message from axios errors.
- **Backend** — every error flows through `AllExceptionsFilter` which:
  - Normalizes the shape (`statusCode`, `message`, `error`, `path`, `timestamp`, `correlationId`)
  - Generates / propagates a correlation id and echoes it in the `x-correlation-id` header
  - Logs 5xx at `error` with the full exception, 4xx at `warn`
- **Provider** — `OpenWeatherProvider.request()` maps 404 → `NotFoundException`, 429 → `ServiceUnavailableException`, 401/403 → masked `ServiceUnavailable` (don't leak misconfig), timeouts → `ServiceUnavailable`, everything else → `BadGateway`.

### How would I track and respond to errors in production?

- Ship the Winston JSON output to a log aggregator (Datadog, Loki, CloudWatch). Search by correlation id from a user-reported error to the exact request.
- Add Sentry (web + API) for stack traces — keyed by correlation id so the same id ties UI + API + logs together.
- Set SLO alerts on:
  - 5xx rate from the API
  - p95 OpenWeather call latency (proxy for upstream degradation)
  - Cache hit rate dropping (signals key fragmentation or eviction issues)
- `/health` is wired to Mongo via Terminus, suitable for k8s `readinessProbe`.

### Production-ready checklist

| Concern | Status |
| --- | --- |
| Helmet, CORS, body size limits | ✅ |
| Rate limiting (per IP) | ✅ via `@nestjs/throttler`, configurable via env |
| Structured logging w/ correlation id | ✅ Winston JSON + filter |
| Health endpoint | ✅ `/health` (liveness + Mongo) |
| Input validation | ✅ class-validator on every DTO |
| Secrets via env, never committed | ✅ `.env.example` only |
| Containerized | ✅ Multi-stage Dockerfiles for api + web; Mongo in compose |
| CI | ✅ Lint, unit, e2e, image builds, Cypress |
| OpenAPI docs | ✅ `/api/docs` |
| Caching upstream | ✅ Mongo TTL cache, 10-minute default |
| **Future work** | Sentry, Prometheus metrics, Redis cache for hot keys, IP-based geolocation fallback, per-user features (auth + favorites + history) |

### Business logic beyond proxying

`apps/api/src/weather/domain/weather.transform.ts`:

- Collapses OpenWeather's 3-hour windows into per-day min/max summaries (`toDailySummaries`).
- Picks the "noonish" entry per day for the day's description/icon.
- Derives a list of `WeatherAdvisory`s — freezing temps, heat advisory, high wind, low visibility, near-term rain probability — so the UI can show actionable guidance instead of raw fields.
- All thresholds are unit-aware: `units=metric` swaps thresholds (0 °C freezing) for the imperial defaults.

`apps/api/src/analytics/analytics.service.ts`:

- `popularLocations()` runs a Mongo aggregation over a configurable time window with rounded coordinates so near-duplicates collapse into one bucket.

`apps/api/src/cache/cache.service.ts`:

- Mongo TTL index on `expiresAt` makes the cache self-cleaning.
- Keys are coordinate-rounded so "Charleston" and `lat=32.7765,lon=-79.9311` share an entry.

## API surface

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/weather/geocode?q=...` | Resolve free-text to candidate locations |
| GET | `/api/v1/weather?q=...&units=...` | Weather report (current + hourly + daily + advisories) |
| GET | `/api/v1/analytics/popular-locations?windowHours=24&limit=10` | Anonymous trending searches |
| GET | `/health` | Liveness + Mongo readiness |
| GET | `/api/docs` | Swagger UI |

## Tradeoffs I'd make differently with more time

- **Cache** would move to Redis with per-key TTL for hot paths; Mongo TTL is fine for this scale but introduces extra round-trips.
- **User features** (favorites, history, "preferred units" persistence) would justify adding auth. The current scope intentionally omits them.
- **OpenWeather free tier** caps daily/forecast endpoints together at 1000 calls/day. I'd add per-IP quotas and graceful 429 surfacing in the UI.
- **Cypress** suite covers the happy path only; I'd add an error-state test next.
- **Geocoding** could be cached identically to the weather call to avoid the double-hop on every text search.

