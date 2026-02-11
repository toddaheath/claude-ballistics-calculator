# Commands History

All commands used to create and develop the Ballistics Calculator project.

## Solution & Project Creation

```bash
dotnet new sln -n BallisticsCalculator
dotnet new classlib -n BallisticsCalculator.Core -o src/BallisticsCalculator.Core
dotnet new classlib -n BallisticsCalculator.Infrastructure -o src/BallisticsCalculator.Infrastructure
dotnet new webapi -n BallisticsCalculator.Api -o src/BallisticsCalculator.Api
dotnet new xunit -n BallisticsCalculator.Core.Tests -o tests/BallisticsCalculator.Core.Tests
dotnet new xunit -n BallisticsCalculator.Api.Tests -o tests/BallisticsCalculator.Api.Tests
dotnet sln add src/BallisticsCalculator.Core/BallisticsCalculator.Core.csproj \
  src/BallisticsCalculator.Infrastructure/BallisticsCalculator.Infrastructure.csproj \
  src/BallisticsCalculator.Api/BallisticsCalculator.Api.csproj \
  tests/BallisticsCalculator.Core.Tests/BallisticsCalculator.Core.Tests.csproj \
  tests/BallisticsCalculator.Api.Tests/BallisticsCalculator.Api.Tests.csproj
```

## NuGet Packages

```bash
# Infrastructure
dotnet add src/BallisticsCalculator.Infrastructure/ package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/BallisticsCalculator.Infrastructure/ package EFCore.NamingConventions

# API
dotnet add src/BallisticsCalculator.Api/ package Microsoft.EntityFrameworkCore.Design
dotnet add src/BallisticsCalculator.Api/ package Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore

# Core Tests
dotnet add tests/BallisticsCalculator.Core.Tests/ package Moq
dotnet add tests/BallisticsCalculator.Core.Tests/ package FluentAssertions

# API Tests
dotnet add tests/BallisticsCalculator.Api.Tests/ package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/BallisticsCalculator.Api.Tests/ package Microsoft.EntityFrameworkCore.InMemory
dotnet add tests/BallisticsCalculator.Api.Tests/ package FluentAssertions
```

## EF Core Migrations

```bash
dotnet ef migrations add InitialCreate \
  --project src/BallisticsCalculator.Infrastructure \
  --startup-project src/BallisticsCalculator.Api \
  --output-dir Migrations
```

## Build & Restore

```bash
dotnet restore
dotnet build BallisticsCalculator.sln
```

## Test Commands

```bash
# Run all tests
dotnet test BallisticsCalculator.sln

# Run Core tests only
dotnet test tests/BallisticsCalculator.Core.Tests/

# Run API tests only
dotnet test tests/BallisticsCalculator.Api.Tests/

# Run a single test
dotnet test --filter "FullyQualifiedName~TrajectoryCalculatorTests.Calculate_308Win_DropsAtLongRange"

# Run with code coverage
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

## Run API Locally

```bash
dotnet run --project src/BallisticsCalculator.Api
# API available at http://localhost:5062
# Swagger at http://localhost:5062/swagger
```

## Frontend Development

```bash
cd src/BallisticsCalculator.Client
npm install
npm run dev
# Dev server at http://localhost:5173 (proxies /api to localhost:5062)
```

## Docker

```bash
# Build and run all services
docker-compose -f deploy/docker/docker-compose.yml up --build

# Services:
# - PostgreSQL: localhost:5432
# - API: localhost:5000
# - Client: localhost:3000
```

## Helm

```bash
# Template rendering (dry run)
helm template test deploy/helm/ballistics-calculator

# Install
helm install ballistics deploy/helm/ballistics-calculator

# Upgrade
helm upgrade ballistics deploy/helm/ballistics-calculator

# Uninstall
helm uninstall ballistics
```
