# Onusandhan AI - Production-Ready Research Portal Monorepo

Welcome to **Onusandhan AI** (Research AI), an academic publication, peer review, and administration portal.

---

## Project Structure

This monorepo is managed via **npm workspaces**:

- `apps/web`: Next.js frontend styled with Tailwind CSS v3 and custom UI elements.
- `apps/api`: Fastify backend server running in TypeScript.
- `packages/db`: Shared Prisma ORM client with PostgreSQL schema and seeding scripts.
- `packages/types`: Shared TypeScript interfaces for request/response payloads, roles, and session structures.
- `packages/ui`: Shared UI components for frontend consumption.
- `packages/config`: Shared compiler configurations.
- `docs`: System topology and role permission matrices.

---

## Prerequisites
- **Node.js**: `v18` or later.
- **npm**: `v9` or later.
- **Docker** (Optional): For running local PostgreSQL, Redis, and MinIO storage.

---

## 🚀 Quick Start Setup

### Step 1: Install Dependencies
Run from the root directory:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` (already done for this directory):
```bash
cp .env.example .env
```

### Step 3: Run Database Services (Docker or SQLite Fallback)

#### Option A: Using Docker (PostgreSQL & Redis)
If Docker is installed and running on your host machine:
```bash
docker compose up -d
```
Then run the database migrations and seed default users:
```bash
npm run db:migrate
npm run db:generate
npx prisma db seed --workspace=@onusandhan/db
```

#### Option B: SQLite Fallback (Zero-Dependency Run)
If Docker is not installed, you can run the portal on an embedded SQLite database:
1. Open `packages/db/prisma/schema.prisma` and modify the datasource block:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
2. Modify the `DATABASE_URL` in `.env` to point to a local file:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
3. Run migrations, client generator, and seed data:
   ```bash
   npx prisma migrate dev --name init --schema=packages/db/prisma/schema.prisma
   npm run db:generate
   npx prisma db seed --workspace=@onusandhan/db
   ```

---

## 🛠️ Running the Application

Start all services in development mode simultaneously from the root folder:
```bash
npm run dev
```

This commands spins up:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🧪 Seeding Details & Test Credentials

Seeding inserts test accounts representing the key portal roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@onusandhan.ai` | `AdminPassword123!` |
| **Faculty / Reviewer** | `faculty@onusandhan.ai` | `FacultyPassword123!` |
| **Author / Scholar** | `author@onusandhan.ai` | `AuthorPassword123!` |

---

## 🔒 Verification & Health Check

Confirm backend, database connection, and storage mocks are active:
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "OK",
  "database": "Connected",
  "services": {
    "api": "Healthy",
    "database": "Healthy"
  }
}
```
