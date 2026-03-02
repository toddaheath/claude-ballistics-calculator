# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack ballistics calculator: C# .NET 8 API with PostgreSQL, React/TypeScript SPA frontend. Users select from 43 common bullet loads and view a trajectory plot with yards/meters toggle. Shot origin is picnic table height (30 inches). The trajectory highlights where bullet height matches its height at 50 yards.

## Architecture

```
src/
  BallisticsCalculator.Core/           # Models, DTOs, ballistics engine, interfaces
  BallisticsCalculator.Infrastructure/ # EF Core DbContext, seed data (43 cartridges), repository
  BallisticsCalculator.Api/            # ASP.NET Web API controllers, DI wiring
  BallisticsCalculator.Client/         # React/TypeScript SPA (Vite + Recharts)

tests/
  BallisticsCalculator.Core.Tests/     # xUnit - ballistics engine, drag model, unit converter tests
  BallisticsCalculator.Api.Tests/      # xUnit - controller integration tests (InMemory DB)

deploy/
  docker/                              # Dockerfiles, docker-compose (API + Client + PostgreSQL)
  helm/ballistics-calculator/          # Helm chart with K8s templates
```

## Build & Test Commands

### Backend (.NET)
- Build: `dotnet build BallisticsCalculator.sln`
- Run all tests: `dotnet test BallisticsCalculator.sln`
- Run Core tests: `dotnet test tests/BallisticsCalculator.Core.Tests/`
- Run API tests: `dotnet test tests/BallisticsCalculator.Api.Tests/`
- Run a single test: `dotnet test --filter "FullyQualifiedName~TestClassName.TestMethodName"`
- Run with coverage: `dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings`
- Run API: `dotnet run --project src/BallisticsCalculator.Api` (port 5062)

### Frontend (React/TypeScript)
- Run frontend: `cd src/BallisticsCalculator.Client && npm run dev` (port 5173, proxies /api to 5062)
- Run frontend tests: `cd src/BallisticsCalculator.Client && npm test` (Vitest)
- TypeScript strict check: `cd src/BallisticsCalculator.Client && npx tsc --noEmit -p tsconfig.app.json`
- Lint: `cd src/BallisticsCalculator.Client && npm run lint`

**Important:** Always validate TypeScript with `tsconfig.app.json` (not the base `tsconfig.json`). The app config has `noUnusedLocals` and `noUnusedParameters` enabled, which is what Vite uses for production builds.

## Docker

- `docker-compose -f deploy/docker/docker-compose.yml up --build`
- API: localhost:5000, Client: localhost:3000, DB: localhost:5432

## Key Technical Details

- Ballistics engine uses RK4 integration with G1 and G7 drag models (selectable)
- G1: 76-entry Cd table (`G1DragModel.cs`), G7: 73-entry Cd table (`G7DragModel.cs`)
- BC unit conversion: lb/in² to slugs/ft² via factor 144/g (32.174)
- Bore elevation angle found via binary search (50 iterations)
- MPBR calculation via two-pass binary search (coarse step=10, fine step=1)
- API auto-applies EF Core migrations on startup (dev mode)
- API tests use InMemory database via WebApplicationFactory
- Frontend tests use Vitest with jsdom + @testing-library/react
- Seed data: 43 cartridges across 4 categories (Handgun, Intermediate, Standard Rifle, Magnum)
- JWT auth: `TrajectoryController` requires `[Authorize]`; `CartridgesController` is public

## Test Counts

- Backend: 231 tests (104 Core + 127 API)
- Frontend: 187 tests (Vitest — 19 test suites)
- Total: 418 tests
