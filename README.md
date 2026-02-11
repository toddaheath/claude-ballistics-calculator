# Ballistics Calculator

A full-stack ballistics trajectory calculator with a C#/.NET 8 API backend, PostgreSQL database, and React/TypeScript frontend. Select from 43 common bullet loads across 4 categories, calculate trajectories using a physics-based ballistics engine, and visualize the results on an interactive plot.

## Features

- **43 pre-loaded cartridges** across Handgun, Intermediate Rifle, Standard Rifle, and Magnum/Long-Range categories
- **Interactive trajectory plot** powered by Recharts showing bullet drop, velocity, energy, and time of flight
- **Yards/Meters toggle** for switching between imperial and metric units
- **Realistic physics** using G1 drag model with 76-entry Cd table and RK4 numerical integration
- **Picnic table zero** — shot origin defaults to 30 inches (bench-rest height), with the trajectory highlighting where bullet height matches its height at 50 yards
- **Swagger/OpenAPI** documentation for the REST API
- **Containerized deployment** with Docker Compose and Helm/Kubernetes charts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│                  React 19 · TypeScript · Vite 7                 │
│              Recharts trajectory plot · Unit toggle              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP/JSON
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API  (.NET 8 / ASP.NET)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Controllers                                              │  │
│  │    GET  /api/cartridges      — list all 43 cartridges     │  │
│  │    GET  /api/cartridges/{id} — single cartridge           │  │
│  │    POST /api/trajectory      — calculate trajectory       │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼────────────────────────────────────┐  │
│  │  Core (Ballistics Engine)                                 │  │
│  │    G1DragModel · TrajectoryCalculator · UnitConverter      │  │
│  │    RK4 integration · Binary search bore elevation          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼────────────────────────────────────┐  │
│  │  Infrastructure (Data Access)                             │  │
│  │    EF Core · CartridgeRepository · Seed Data (43 loads)    │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │  Npgsql
                          ▼
               ┌─────────────────────┐
               │  PostgreSQL 16      │
               │  ballistics DB      │
               └─────────────────────┘
```

### Deployment Topology (Docker Compose)

```
┌──────────────────────────────────────────────────────┐
│  docker-compose                                      │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐   │
│  │  client   │───▶│   api    │───▶│  postgres    │   │
│  │  :3000    │    │  :5000   │    │  :5432       │   │
│  │  (nginx)  │    │  (.NET)  │    │  (pg 16)     │   │
│  └──────────┘    └──────────┘    └──────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
  BallisticsCalculator.Core/           # Models, DTOs, ballistics engine, interfaces
  BallisticsCalculator.Infrastructure/ # EF Core DbContext, seed data (43 cartridges), repository
  BallisticsCalculator.Api/            # ASP.NET Web API controllers, DI wiring, Swagger
  BallisticsCalculator.Client/         # React/TypeScript SPA (Vite + Recharts)

tests/
  BallisticsCalculator.Core.Tests/     # xUnit — ballistics engine, drag model, unit converter (57 tests)
  BallisticsCalculator.Api.Tests/      # xUnit — controller integration tests w/ InMemory DB (16 tests)

deploy/
  docker/                              # Dockerfiles, docker-compose (API + Client + PostgreSQL)
  helm/ballistics-calculator/          # Helm chart with K8s templates (ingress, statefulset, etc.)
```

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- [PostgreSQL 16](https://www.postgresql.org/) (or use Docker)

### Local Development

**1. Start PostgreSQL** (if not using Docker):

```bash
# Default connection string expects:
#   Host=localhost; Database=ballistics; Username=postgres; Password=postgres
createdb ballistics
```

**2. Run the API** (port 5062):

```bash
dotnet run --project src/BallisticsCalculator.Api
```

The API auto-applies EF Core migrations and seeds 43 cartridges on startup. Swagger UI is available at `http://localhost:5062/swagger`.

**3. Run the frontend** (port 5173):

```bash
cd src/BallisticsCalculator.Client
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the API on port 5062. Open `http://localhost:5173` in your browser.

## Docker Deployment

Build and run the full stack with Docker Compose:

```bash
docker-compose -f deploy/docker/docker-compose.yml up --build
```

| Service    | URL                    |
|------------|------------------------|
| Client     | http://localhost:3000   |
| API        | http://localhost:5000   |
| PostgreSQL | localhost:5432          |

To stop and remove volumes:

```bash
docker-compose -f deploy/docker/docker-compose.yml down -v
```

## Helm / Kubernetes Deployment

```bash
helm install ballistics-calculator deploy/helm/ballistics-calculator/
```

Default values:

| Setting           | Value                |
|-------------------|----------------------|
| Ingress host      | ballistics.local     |
| Ingress class     | nginx                |
| API replicas      | 1                    |
| Client replicas   | 1                    |
| PostgreSQL storage| 1Gi                  |

Override with `--set` or a custom `values.yaml`:

```bash
helm install ballistics-calculator deploy/helm/ballistics-calculator/ \
  --set ingress.host=ballistics.example.com \
  --set api.replicas=3
```

## API Reference

### `GET /api/cartridges`

Returns all 43 cartridges.

```json
[
  {
    "id": 1,
    "name": ".380 ACP 95gr FMJ",
    "category": "Handgun",
    "bulletType": "FMJ",
    "bulletWeightGrains": 95,
    "muzzleVelocityFps": 955,
    "ballisticCoefficientG1": 0.119
  }
]
```

### `GET /api/cartridges/{id}`

Returns a single cartridge by ID. Returns `404` if not found.

### `POST /api/trajectory`

Calculate bullet trajectory for a given cartridge.

**Request:**

```json
{
  "cartridgeId": 29,
  "zeroRange": 100,
  "maxRange": 500,
  "unitSystem": "yards",
  "shotHeightInches": 30
}
```

All fields except `cartridgeId` are optional and default to sensible values (`zeroRange`: 100, `shotHeightInches`: 30, `unitSystem`: "yards").

**Response:**

```json
{
  "cartridgeName": ".308 Win 168gr BTHP Match",
  "zeroRange": 100,
  "muzzleVelocity": 2650,
  "maxRange": 500,
  "boreElevationAngleMOA": 3.42,
  "heightAt50": 0.87,
  "secondCrossingRange": 287.5,
  "shotHeightInches": 30,
  "unitSystem": "yards",
  "points": [
    {
      "range": 0,
      "height": -1.5,
      "velocity": 2650,
      "energy": 2619.7,
      "timeOfFlight": 0,
      "mach": 2.37,
      "drop": 0
    }
  ]
}
```

### `GET /health`

Health check endpoint. Returns `200 OK` when the API and database are healthy.

## Ballistics Engine

The trajectory calculator lives in `BallisticsCalculator.Core` and uses real physics to simulate bullet flight:

1. **G1 Drag Model** — A 76-entry table of drag coefficients (Cd) vs. Mach number, with linear interpolation between entries. The standard G1 reference projectile profile is used.

2. **RK4 Integration** — Fourth-order Runge-Kutta numerical integration steps the bullet through time, computing position, velocity, and deceleration at each point.

3. **Ballistic Coefficient Conversion** — BC values (lb/in²) are converted to slugs/ft² using the factor `144 / g` where `g = 32.174 ft/s²`.

4. **Bore Elevation (Zero Finding)** — A binary search algorithm (50 iterations) finds the bore angle that produces zero bullet drop at the specified zero range.

5. **Second Crossing Detection** — After the bullet drops through the line-of-sight, the engine finds the range where the bullet's height again matches its height at 50 yards — useful for point-blank range estimation.

## Testing

Run the full test suite (73 tests):

```bash
dotnet test BallisticsCalculator.sln
```

Run with code coverage:

```bash
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

Run a specific test:

```bash
dotnet test --filter "FullyQualifiedName~TrajectoryCalculatorTests.Calculate_308Win_MuzzleVelocity"
```

### Test Breakdown

| Project               | Tests | Coverage |
|-----------------------|-------|----------|
| Core.Tests            | 57    | Ballistics engine, G1 drag model, unit converter, models |
| Api.Tests             | 16    | Controller integration tests with InMemory DB            |
| **Total**             | **73**|                                                           |

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 19, TypeScript 5.9, Vite 7.3, Recharts 3 |
| Backend      | .NET 8, ASP.NET Core, Entity Framework Core 8   |
| Database     | PostgreSQL 16                                    |
| Testing      | xUnit, FluentAssertions, Moq, coverlet          |
| API Docs     | Swashbuckle (Swagger/OpenAPI)                    |
| Containers   | Docker, docker-compose                           |
| Orchestration| Helm 3, Kubernetes                               |

## Cartridge Library

43 loads organized into 4 categories:

- **Handgun** (12) — .380 ACP, 9mm Luger, .40 S&W, .45 ACP, .357 Magnum, .44 Magnum, 10mm Auto
- **Intermediate Rifle** (7) — 5.56 NATO, .223 Rem, .300 BLK, 7.62x39mm
- **Standard Rifle** (15) — .243 Win, 6.5 Creedmoor, 6.5 Grendel, .270 Win, 7mm Rem Mag, .30-30 Win, .308 Win, .30-06 Springfield, 7.62 NATO
- **Magnum/Long-Range** (9) — .300 Win Mag, .338 Lapua Mag, .338 Win Mag, .375 H&H Mag, .50 BMG

## License

This project is provided as-is for educational and demonstration purposes.
