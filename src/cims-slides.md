---

## Architecture

```mermaid
flowchart TD
    Client --> MW --> Ctrl --> Svc --> Repo --> DB
    MW[Middleware<br/>auth · authz · validate]
    Ctrl[Controller<br/>HTTP only]
    Svc[Service<br/>business logic]
    Repo[Repository<br/>parameterized SQL]
    DB[(MySQL 8)]