# Employee Management System (EMS)

A full-stack Employee Management System with JWT authentication, role-based access
control (RBAC), organizational hierarchy management, and a responsive dashboard —
built for the Full Stack Developer hiring assignment.

## Tech Stack

| Layer          | Choice                                                   |
|----------------|-----------------------------------------------------------|
| Frontend       | React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts    |
| Backend        | Node.js + Express.js                                       |
| Database       | MongoDB + Mongoose                                          |
| Authentication | JWT (httpOnly cookie + bearer token), bcrypt password hashing |

MongoDB was chosen over PostgreSQL because the organizational hierarchy (self-referencing
manager relationships) and flexible employee schema map cleanly onto a document model with
Mongoose's `populate`, and it keeps local setup to a single container.

## Monorepo Structure

```
ems/
├── backend/          Express API (see backend/README.md for API-specific notes)
│   ├── src/
│   │   ├── config/       DB connection
│   │   ├── controllers/  Route handlers (auth, employees, organization, dashboard, import)
│   │   ├── middleware/   JWT auth, RBAC guard, validation
│   │   ├── models/       Mongoose Employee/User model
│   │   ├── routes/       Express routers
│   │   └── utils/        Token signing, DB seed script
│   ├── tests/            Jest + Supertest + mongodb-memory-server test suites
│   └── Dockerfile
├── frontend/         React + Vite SPA
│   ├── src/
│   │   ├── api/          Axios client
│   │   ├── components/   Shell (layout/nav), ProtectedRoute, EmployeeFormModal
│   │   ├── context/      Auth + Theme (dark mode) providers
│   │   ├── pages/        Login, Dashboard, Employees, Organization, Profile
│   │   └── types/        Shared TypeScript types
│   └── Dockerfile
└── docker-compose.yml   One-command local stack (Mongo + API + SPA behind Nginx)
```

## Getting Started (local, without Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env       # adjust MONGO_URI / JWT_SECRET as needed
npm install
npm run seed                # creates the first Super Admin account
npm run dev                 # starts on http://localhost:5000
```

Seeded credentials (override via `.env`):
- Email: `admin@ems.com`
- Password: `Admin@123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173` and log in with the seeded Super Admin.

## Getting Started (Docker)

```bash
docker compose up --build
```

- Frontend (Nginx): http://localhost:8080
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

The backend container will need the Super Admin seeded once:

```bash
docker compose exec backend npm run seed
```

## Roles & Permissions

| Action                              | Super Admin | HR Manager | Employee            |
|--------------------------------------|:-----------:|:----------:|:--------------------:|
| View employee directory              | ✅          | ✅         | ✅ (read-only list)  |
| Create employee                      | ✅          | ✅ (not as Super Admin) | ❌ |
| Edit any employee                    | ✅          | ✅ (not Super Admin accounts) | ❌ |
| Edit own profile (phone, photo only) | ✅          | ✅         | ✅                    |
| Delete (soft-delete) employee        | ✅          | ❌         | ❌                    |
| Assign reporting manager             | ✅          | ✅         | ❌                    |
| Import employees via CSV             | ✅          | ✅         | ❌                    |

Soft delete: deleting an employee sets `isDeleted: true` and `status: Inactive` rather
than removing the document, and reassigns their direct reports up to their own manager
to avoid orphaned hierarchy links.

## Features Implemented

- **Auth**: login, logout, protected routes, bcrypt password hashing, JWT (cookie + bearer).
- **RBAC**: Super Admin / HR Manager / Employee, enforced on both the API and the UI.
- **Dashboard**: total/active/inactive employee counts, department count, bar + donut charts.
- **Employee CRUD**: full fields per spec, field-level restrictions for self-editing.
- **Organizational hierarchy**: assign/change reporting manager, tree view, direct reports
  endpoint, and circular-reference prevention (`PATCH /api/employees/:id/manager` walks the
  candidate manager's chain up to the root and rejects the change if it would loop back to
  the employee being reassigned).
- **Search / filter / sort**: name/email search, department/role/status filters, sort by
  joining date or name, server-side pagination.
- **Validation**: express-validator on the backend (email, phone, salary, required fields),
  matching client-side `required`/`type` constraints on the form.
- **Bonus features**: pagination, soft delete, CSV import, dashboard charts, dark mode,
  Docker Compose, Jest/Supertest unit tests.

## API Documentation

See [`backend/API_DOCS.md`](backend/API_DOCS.md) for the full endpoint reference.

## Running Tests

```bash
cd backend
npm test
```

Tests use `mongodb-memory-server` to spin up an ephemeral MongoDB instance, so no external
database is required — only outbound network access to download the MongoDB binary the
first time (cached afterwards). If your environment blocks that download, point
`MONGOMS_DOWNLOAD_URL`/`MONGOMS_VERSION` at a reachable mirror, or run tests against a real
local MongoDB instance instead.

## Notes on Scope

This was built to the 8–10 hour assignment brief. A few things a production system would
add next: refresh-token rotation, rate limiting on `/auth/login`, audit logging on RBAC
actions, and file storage (S3/Cloudinary) for profile images instead of a plain string field.
