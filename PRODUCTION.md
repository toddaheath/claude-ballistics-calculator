# Production Deployment Guide

## Overview

Production architecture: Ingress (TLS) → Client pods (static React SPA) → API pods (.NET 8) → Managed PostgreSQL.

```
                          ┌─────────────┐
Internet ──► Ingress ────►│ Client (x2) │
             (TLS)   │    └─────────────┘
                     │    ┌─────────────┐     ┌────────────┐
                     └───►│  API (x2+)  │────►│ PostgreSQL │
                          └─────────────┘     └────────────┘
```

## Infrastructure Requirements

| Resource | Recommendation |
|----------|---------------|
| Kubernetes | AKS, EKS, or GKE (1.28+) |
| PostgreSQL | Managed service (Azure Database for PostgreSQL, RDS, Cloud SQL) |
| Container Registry | GitHub Container Registry (ghcr.io) — images pushed by CI |
| Ingress Controller | NGINX Ingress Controller |
| TLS Certificates | cert-manager + Let's Encrypt |
| DNS | CNAME to ingress load balancer IP |

## Security Hardening

### Database Credentials

Never use default credentials in production. Store secrets externally and reference them:

```bash
# Create the Kubernetes secret from your vault
kubectl create secret generic ballistics-db-credentials \
  --from-literal=POSTGRES_PASSWORD=<from-vault> \
  --from-literal=POSTGRES_USER=<from-vault> \
  --namespace ballistics
```

The production Helm values reference `existingSecret: ballistics-db-credentials` instead of inline passwords.

### TLS Termination

Install cert-manager and configure a ClusterIssuer for Let's Encrypt:

```bash
helm install cert-manager jetstack/cert-manager --set installCRDs=true
```

The ingress template already supports TLS when `ingress.tls.enabled=true`.

### Application Environment

Set `ASPNETCORE_ENVIRONMENT=Production` to:
- Disable Swagger UI
- Disable automatic EF Core migrations on startup (use the migration Job instead)
- Enable stricter error handling

### Network Policies

Restrict database access to API pods only:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-access
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: postgresql
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/component: api
      ports:
        - port: 5432
```

### Image Scanning

Add Trivy scanning to CI by adding a step in `.github/workflows/docker.yml`:

```yaml
- name: Scan API image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.API_IMAGE }}:${{ github.sha }}
    severity: CRITICAL,HIGH
    exit-code: 1
```

## Database Management

### Migrations

In production, EF Core migrations run as a Kubernetes Job (Helm pre-install/pre-upgrade hook) instead of on application startup. The migration job template is at `deploy/helm/ballistics-calculator/templates/migration-job.yaml`.

The job uses the API image with a `--migrate-only` flag. To support this, add a startup check in `Program.cs`:

```csharp
if (args.Contains("--migrate-only"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<BallisticsDbContext>();
    db.Database.Migrate();
    return;
}
```

### Backups

Use your managed database provider's automated backup feature. For self-managed PostgreSQL, create a CronJob:

```bash
kubectl create cronjob pg-backup --schedule="0 2 * * *" \
  --image=postgres:16-alpine \
  -- pg_dump -h <host> -U <user> <db> | gzip > /backups/$(date +%F).sql.gz
```

### Connection Pooling

For high-traffic deployments, add PgBouncer as a sidecar or use your cloud provider's built-in connection pooling (e.g., Azure PgBouncer, RDS Proxy).

## Scaling

| Component | Strategy | Configuration |
|-----------|----------|---------------|
| API | HPA on CPU utilization | min: 2, max: 10, target: 70% CPU |
| Client | Fixed replicas or HPA | 2 replicas (static files, low resource) |
| PostgreSQL | Vertical scaling | Increase instance size as needed |

Example HPA for the API:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ballistics-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ballistics-calculator-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Monitoring & Observability

### Health Checks

The API exposes `/health` — already configured as liveness and readiness probes in the Helm templates.

### Logging

The API writes structured logs to stdout. In a Kubernetes cluster, these are collected by the cluster's logging stack (Fluentd/Fluent Bit → Elasticsearch/Loki).

For enhanced structured logging, add Serilog:

```bash
dotnet add src/BallisticsCalculator.Api package Serilog.AspNetCore
```

### Alerts

Set up alerts for:
- Pod restart count > 3 in 10 minutes
- Health check endpoint failures
- API response latency p95 > 500ms
- Container memory usage > 80% of limit

## CI/CD Pipeline

```
PR opened ──► CI (dotnet build/test + client lint/build)
                │
                ▼
Merge to main ──► CI passes ──► Docker Build & Push (ghcr.io)
                                    │
                                    ▼
                              GitHub Pages Deploy (demo mode)
                                    │
                                    ▼
                     Manual trigger ──► Production Deploy (Helm upgrade)
```

1. **Pull Request**: CI workflow runs .NET build/test and client lint/build
2. **Merge to main**: CI runs again, then Docker workflow builds and pushes images
3. **GitHub Pages**: Demo-mode frontend deployed automatically
4. **Production**: Manual `workflow_dispatch` triggers Helm upgrade with specified image tag

## Deployment Procedure

### Deploy

```bash
# Via GitHub Actions (recommended)
# Go to Actions → Production Deploy → Run workflow
# Select environment and enter the image tag (commit SHA)

# Via CLI
helm upgrade --install ballistics-calculator \
  deploy/helm/ballistics-calculator/ \
  -f deploy/helm/ballistics-calculator/values-production.yaml \
  --set api.image.tag=<commit-sha> \
  --set client.image.tag=<commit-sha> \
  --namespace ballistics \
  --wait
```

### Rollback

```bash
# Roll back to previous release
helm rollback ballistics-calculator --namespace ballistics

# Roll back to a specific revision
helm rollback ballistics-calculator <revision> --namespace ballistics

# Check release history
helm history ballistics-calculator --namespace ballistics
```

### Verify Deployment

```bash
# Check pod status
kubectl get pods -n ballistics

# Check rollout status
kubectl rollout status deployment/ballistics-calculator-api -n ballistics

# Test health endpoint
kubectl port-forward svc/ballistics-calculator-api 8080:80 -n ballistics
curl http://localhost:8080/health
```
