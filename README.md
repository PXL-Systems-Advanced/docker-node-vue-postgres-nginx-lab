# Docker Compose Lab: Node, Vue, Postgres & Nginx

A production-ready **reference architecture for a full-stack application using Docker Compose**. This repository demonstrates the differences between **Development** (hot-reloading, bind mounts) and **Production** (multi-stage builds, static assets, immutable images) workflows.

- [Stack Architecture](#stack-architecture)
- [Getting Started](#getting-started)
  - [Configuration (Secrets)](#configuration-secrets)
  - [Run in Development Mode](#run-in-development-mode)
  - [Run in Production Mode (Simulated)](#run-in-production-mode-simulated)
- [Development Workflow (VS Code Remote)](#development-workflow-vs-code-remote)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Start the Environment](#2-start-the-environment)
  - [3. Attach VS Code to a Service](#3-attach-vs-code-to-a-service)
  - [4. The "Inner" Workflow](#4-the-inner-workflow)
  - [5. Database Management](#5-database-management)
- [Project Structure](#project-structure)
- [Key Concepts \& Best Practices](#key-concepts--best-practices)
  - [Nginx as a Reverse Proxy](#nginx-as-a-reverse-proxy)
  - [Networking](#networking)
  - [Multi-Stage Builds (Production)](#multi-stage-builds-production)
  - [Database Persistence](#database-persistence)
  - [Security Basics](#security-basics)
- [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
  - [Workflow Features](#workflow-features)
  - [Setup Instructions](#setup-instructions)
- [Troubleshooting](#troubleshooting)

## Stack Architecture

| Service | Technology | Role |
| :--- | :--- | :--- |
| **Proxy** | Nginx (Alpine) | Entry point, reverse proxy, serves static files (Prod) |
| **Frontend** | Vue 3 + Vite | Single Page Application (SPA) |
| **Backend** | Node 22 + Express | REST API |
| **Database** | PostgreSQL 16 | Persistent data storage |

-----

## Getting Started

### Configuration (Secrets)

We use environment variables to configure the app.

>Do not commit actual secrets to Git. Provide a template file `.env.example` instead.

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` to set your own `POSTGRES_PASSWORD`.

### Run in Development Mode

*Focus: Speed, debugging, and live updates.*

```bash
docker compose up --build
```

- **URL:** Open <http://localhost>
- **Hot Reloading:**
  - Edit `frontend/src/App.vue`: Browser updates instantly (Hot Module Replacement).
  - Edit `backend/src/index.js`: Backend restarts automatically (Nodemon).
- **Logs:** Streamed directly to your terminal.

To stop: Press `Ctrl+C`.

### Run in Production Mode (Simulated)

*Focus: Performance, stability, and security.*

```bash
docker compose -f compose.prod.yaml up --build
```

- **What changes?**
  - **Frontend:** The `nginx/Dockerfile.prod` runs a **Multi-Stage Build**. It compiles Vue into static HTML/CSS/JS and discards the Node environment, resulting in a tiny Nginx image serving raw files.
  - **Backend:** Runs with `node` instead of `nodemon`.
  - **Secrets:** *Note: In this lab, we still read from `.env`. In a real production environment, secrets are injected via a vault (e.g., [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/), [HashiCorp Vault](https://www.hashicorp.com/en/products/vault)), not a file.*

-----

## Development Workflow (VS Code Remote)

Since dependencies (Node, Postgres) are not installed on your host machine, standard VS Code will show errors (missing imports) and cannot run commands. To fix this, we use the **Attach to Running Container** feature.

### 1\. Prerequisites

Install the **Dev Containers** extension (Microsoft) in VS Code.

### 2\. Start the Environment

Open a terminal in your project root and run:

```bash
docker compose up --build
```

### 3\. Attach VS Code to a Service

1. Open the Command Palette (`F1` or `Ctrl+Shift+P`).
2. Type and select: **Dev Containers: Attach to Running Container...**
3. Select the service you want to edit (e.g., `/backend` or `/frontend`).
4. VS Code will open a **new window**.

### 4\. The "Inner" Workflow

This new window runs *inside* the Docker container.

- **IntelliSense:** Works perfectly because VS Code can now see the `node_modules` inside the container.
- **Terminal:** The terminal in this window is a Linux shell inside the container.
- **Installing Packages:** Run `npm` commands directly in the integrated terminal:

    ```bash
    # You are already inside the container
    npm install uuid
    ```

    *(This updates `package.json` on your host via the volume mount).*

### 5\. Database Management

To inspect the database without a local SQL client, use the container's built-in tool.

1. Attach VS Code to the `db` container (or use the external terminal):

    ```bash
    docker compose exec db psql -U appuser -d appdb
    ```

2. Run SQL commands:
      - `\dt` : List tables
      - `select * from todos;` : View data
      - `\q` : Quit

-----

## Project Structure

```text
.
├── compose.yaml              # Orchestrates the DEV environment
├── compose.prod.yaml         # Orchestrates the PROD environment
├── .env                      # Local secrets (gitignored)
├── backend/
│   ├── Dockerfile            # Node setup
│   └── src/                  # API logic
├── frontend/
│   ├── Dockerfile            # Dev-only setup
│   └── vite.config.js        # Vite config
├── nginx/
│   ├── Dockerfile.prod       # PROD: Builds Vue app + Configures Nginx
│   ├── nginx.dev.conf        # DEV: Proxies to Vite dev server
│   └── nginx.prod.conf       # PROD: Serves static files + proxies API
└── db/
    └── init.sql              # Database seed script
```

-----

## Key Concepts & Best Practices

### Nginx as a Reverse Proxy

Instead of accessing the Node API (`:3000`) or Vite (`:5173`) directly, we route everything through Nginx on port `80`.

This solves [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) issues (same origin) and mimics real-world deployment where the internal network is hidden from the public internet.

### Networking

We use a custom bridge network `app-net`. Containers talk to each other by **service name**.

- The Backend talks to Postgres via `DB_HOST: db`.
- Nginx talks to the Backend via `http://backend:3000`.

### Multi-Stage Builds (Production)

Look at `nginx/Dockerfile.prod`. It has two stages:

1. **Build Stage:** Uses a heavy Node image to install dependencies and compile the Vue app.
2. **Production Stage:** Copies *only* the `dist/` folder from stage 1 into a lightweight Nginx image.

<!-- end list -->

- **Result:** A smaller, more secure image without source code or `node_modules`.

### Database Persistence

Postgres data is stored in a **Docker Volume** (`db-data`).

- If you delete the container, the data persists.
- **To reset the database:**
  
  ```bash
  docker compose down -v
  ```

  *(The `-v` flag deletes the volumes)*.

### Security Basics

- **Non-root User:** The Backend Dockerfile switches to `USER node` to prevent the application from having root access to the container OS.
- **Graceful Shutdown:** The Node app listens for `SIGTERM` signals to close database connections properly before the container stops.

-----

## CI/CD Pipeline (GitHub Actions)

This repository includes a `.github/workflows/ci-cd.yml` file

[Image of CI/CD pipeline flow diagram]
to automate building and pushing images to Docker Hub.

### Workflow Features

- **Modern Caching:** Uses `type=gha` (GitHub Actions Cache) to store Docker layers. This drastically reduces build time by reusing layers (like `npm install`) from previous runs.
- **Automated Tagging:** Uses `docker/metadata-action` to handle versioning.
  - Pushing to `main` → tags image as `main`.
  - Pushing a git tag `v1.0.0` → tags image as `1.0.0` and `latest`.
- **Security:** Credentials are injected via repository secrets, never hardcoded.

### Setup Instructions

To enable the workflow on your own fork:

1. **Docker Hub Setup:**

      - Create a repository on Docker Hub.
      - Go to **Account Settings \> Security \> New Access Token**.
      - Create a Read/Write/Delete token. *Do not use your password.*

2. **GitHub Secrets:**

      - Go to your Repo Settings \> Secrets and variables \> Actions.
      - Add `DOCKERHUB_USERNAME`.
      - Add `DOCKERHUB_TOKEN` (paste the token created above).

3. **Update Workflow Variables:**

      - Edit `.github/workflows/ci-cd.yml`.
      - Update `env.BACKEND_IMAGE` and `env.WEB_IMAGE` to match your Docker Hub repository names.

-----

## Troubleshooting

**"Port is already allocated"**
Stop any other Postgres or Web servers running on your machine, or modify the `ports` mapping in `compose.yaml`.

**"Connection refused" between Backend and DB**
Wait a few seconds. Postgres takes longer to start than Node. The `depends_on: service_healthy` check in the compose file usually handles this, but on slow machines, it might time out.

**Changes not showing in Dev?**
Ensure you are using `compose.yaml` (Dev) and not `compose.prod.yaml` (Prod). Prod images are immutable; they do not watch your files.
