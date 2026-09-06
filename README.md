# Project Management SaaS — Enterprise RESTful API Backend 📋

---

### 📦 Submission Information

| Requirement | Details |
| :--- | :--- |
| **Project Name** | Project Management SaaS Backend API |
| **Backend Repo** | `https://github.com/amdadislam01/level_2-assingment-6` |
| **Live API URL** | `https://project-management-saas-backend.vercel.app` (or Render deployment) |
| **API Documentation** | [`postman_collection.json`](./postman_collection.json) (Importable Postman Collection) |
| **Demo Video Link** | `https://drive.google.com/file/d/demo_video_link/view` |
| **Admin Email** | `admin@saas.com` |
| **Admin Password** | `Admin@123456` |

---

## 🚀 Executive Summary & Problem Domain

**Project Management SaaS** is an enterprise-grade, multi-tenant productivity platform backend designed for agile software development teams, organization leaders, and enterprise project managers. 

It provides strict **Multi-Tenancy** and **Role-Based Access Control (RBAC)** across **3 distinct system roles**:
1. **`ADMIN` (System Admin / Org Owner)**: Complete governance over organizations, user management, deletion rights, subscription plans, audit logs, and system analytics.
2. **`MANAGER` (Project Manager)**: Creation & management of teams, projects, agile sprints, tasks, member onboarding, and task assignments.
3. **`MEMBER` (Developer / Team Member)**: Execution of assigned tasks, state transitions (TODO -> IN_PROGRESS -> IN_REVIEW -> DONE), subtask management, and project comments.

The project features **37 RESTful API Endpoints**, real **Stripe payment integration**, **Zod server-side input validation**, **Rate Limiting (`express-rate-limit`)**, **Helmet security headers**, and **Prisma ORM with PostgreSQL**.

---

## 🛠️ Technology Stack & Architecture

### Backend Stack
- **Runtime**: Node.js v22 (ES Modules)
- **Language**: TypeScript v5.6 (Strict Type Checking)
- **Framework**: Express.js v4.21
- **Database & ORM**: PostgreSQL with Prisma ORM v5.22
- **Authentication**: Custom JWT (Access Token + Refresh Token) & GCP Social Login support
- **Validation**: Zod v3.23 schema validation middleware
- **Security**: Helmet, CORS, Express-Rate-Limit (100 requests per 15 minutes)
- **Payment Processing**: Stripe API v22 (Real checkout sessions & Webhook verification)
- **Logging & Utilities**: Morgan HTTP logger, Cookie-parser, Bcryptjs password hashing

### Architecture Pattern
The project follows a clean, layered modular architecture:
```
Request ──► Route ──► Middleware (Auth/RBAC/Zod) ──► Controller ──► Service ──► Prisma ORM ──► PostgreSQL
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | `ADMIN` | `MANAGER` | `MEMBER` |
| :--- | :---: | :---: | :---: |
| `POST /auth/register` & `POST /auth/login` | Public | Public | Public |
| `GET /users/me` & `PATCH /users/me` | ✅ | ✅ | ✅ |
| `GET /users` (User List) | ✅ | ✅ | ❌ (403 Forbidden) |
| `POST /organizations` | ✅ | ✅ | ❌ |
| `DELETE /organizations/:id` | ✅ | ❌ | ❌ |
| `POST /projects` & `PATCH /projects/:id` | ✅ | ✅ | ❌ |
| `DELETE /projects/:id` | ✅ | ❌ | ❌ |
| `POST /sprints` & `PATCH /sprints/:id/status` | ✅ | ✅ | ❌ |
| `POST /tasks` & `PATCH /tasks/:id` | ✅ | ✅ | ✅ |
| `PATCH /tasks/:id/status` (State Transition) | ✅ | ✅ | ✅ |
| `DELETE /tasks/:id` | ✅ | ✅ | ❌ |
| `GET /activity-logs` (Audit Trails) | ✅ | ✅ | ❌ |
| `POST /payments/initiate` & `/verify` | ✅ | ✅ | ✅ |
| `GET /payments/stats/summary` | ✅ | ❌ | ❌ |

---

## 📅 5-Day Work Breakdown Summary

| Day | Focus Area | Key Accomplishments |
| :---: | :--- | :--- |
| **Day 1** | Planning & Database Foundation | Schema design, Prisma ORM models, relations, seed data, initial Git setup. |
| **Day 2** | Auth & Core APIs | JWT access/refresh token handlers, GCP Google Login, RBAC middleware, User & Profile APIs. |
| **Day 3** | Business Logic & Validation | 37 total APIs, Zod request body validation middleware, structured error handler, soft deletes, activity log tracking. |
| **Day 4** | Payment Gateway & Security | Stripe checkout session initiation, webhook signature processing, payment verification, rate limiter middleware. |
| **Day 5** | Deployment, Polish & Documentation | Production build validation, Vercel serverless configuration, Postman collection export, README polish. |

---

## 📊 Complete 37 API Endpoints Reference

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — User registration with email/password and role assignment
- `POST /api/v1/auth/login` — User login & JWT token pair issuance
- `POST /api/v1/auth/refresh-token` — Refresh access token via cookie/body
- `POST /api/v1/auth/google` — GCP Google Social Login integration

### 2. User Management (`/api/v1/users`)
- `GET /api/v1/users/me` — Fetch current user profile
- `PATCH /api/v1/users/me` — Update user profile details
- `GET /api/v1/users` — List all users (Admin/Manager with pagination & search)

### 3. Organizations (`/api/v1/organizations`)
- `POST /api/v1/organizations` — Create organization
- `GET /api/v1/organizations` — List organizations (Paginated & search filter)
- `GET /api/v1/organizations/:id` — Get organization details
- `PATCH /api/v1/organizations/:id` — Update organization
- `DELETE /api/v1/organizations/:id` — Soft-delete organization (Admin only)
- `POST /api/v1/organizations/:id/members` — Add member to organization

### 4. Projects (`/api/v1/projects`)
- `POST /api/v1/projects` — Create new project under organization
- `GET /api/v1/projects` — List projects (Filtered by status, search, pagination)
- `GET /api/v1/projects/:id` — Get project details with teams and sprints
- `PATCH /api/v1/projects/:id` — Update project metadata & status
- `DELETE /api/v1/projects/:id` — Soft-delete project (Admin only)

### 5. Sprints (`/api/v1/sprints`)
- `POST /api/v1/sprints` — Create sprint for a project
- `GET /api/v1/sprints/project/:projectId` — List sprints by project ID
- `PATCH /api/v1/sprints/:id/status` — Update sprint status (PLANNING -> ACTIVE -> COMPLETED)

### 6. Tasks (`/api/v1/tasks`)
- `POST /api/v1/tasks` — Create task
- `GET /api/v1/tasks` — List tasks (Pagination, priority & status filters)
- `GET /api/v1/tasks/:id` — Get task details with comments & subtasks
- `PATCH /api/v1/tasks/:id` — Update task details
- `PATCH /api/v1/tasks/:id/status` — Update task status transition
- `DELETE /api/v1/tasks/:id` — Delete task
- `POST /api/v1/tasks/:id/comments` — Add comment to task
- `POST /api/v1/tasks/:id/subtasks` — Add subtask to task
- `PATCH /api/v1/tasks/subtasks/:subtaskId/toggle` — Toggle subtask completion status

### 7. Activity Logs (`/api/v1/activity-logs`)
- `GET /api/v1/activity-logs` — Audit log trail (Filtered by action & pagination)

### 8. Payment Integration (`/api/v1/payments`)
- `POST /api/v1/payments/initiate` — Initiate Stripe checkout session
- `POST /api/v1/payments/verify` — Verify completed session & update organization plan
- `POST /api/v1/payments/webhook` — Public webhook receiver for automated gateway callbacks
- `GET /api/v1/payments/stats/summary` — Payment revenue & analytics summary (Admin only)
- `GET /api/v1/payments/:id` — Get payment details
- `GET /api/v1/payments` — List payments (Paginated & status filter)

---

## 💳 Payment Flow Architecture

```
User App ──► POST /payments/initiate ──► Create Stripe Session ──► Redirect URL
                                                                       │
Backend Webhook ◄── Stripe Callback Event ◄── User Completes Payment ◄─┘
       │
       ▼
Update Payment Status (COMPLETED) + Upgrade Org Plan (PRO/ENTERPRISE) + Audit Log
```

---

## 🎥 Video Explanation Walkthrough Guide (5–10 Minutes)

When recording your presentation video, follow this structured outline:

1. **0:00 - 1:30 | Project Overview & Architecture**:
   - Introduce project domain: Project Management SaaS.
   - Highlight modular folder structure: `src/modules/{auth, user, organization, project, sprint, task, payment, activityLog}`.
   - Explain clean data flow: `Routes -> Validation Middleware -> Controller -> Service -> Prisma ORM -> PostgreSQL`.

2. **1:30 - 3:30 | 3 Roles & Authorization (RBAC)**:
   - Demonstrate `admin@saas.com` logging in and obtaining Bearer Token.
   - Show `GET /users` with Admin token (200 OK).
   - Show `member@saas.com` logging in and attempting `GET /users` (403 Forbidden).

3. **3:30 - 5:30 | Core CRUD & Validation**:
   - Demonstrate `POST /projects` with invalid body to show structured Zod error response:
     ```json
     {
       "success": false,
       "message": "Validation error",
       "errors": [{ "field": "body.name", "message": "Project name is required" }]
     }
     ```
   - Show successful creation, state transition (`PATCH /tasks/:id/status`), and soft deletion.

4. **5:30 - 7:30 | Real Payment Flow Demonstration**:
   - Demonstrate `POST /payments/initiate` creating a Stripe checkout URL.
   - Execute `POST /payments/verify` to confirm subscription upgrade in database.

5. **7:30 - 9:00 | Technical Challenge Solution**:
   - Explain how complex Prisma relational queries and transactions were implemented to ensure data integrity during organization member management and subscription plan upgrades.

---

## ⚙️ Local Installation & Development Guide

### Prerequisites
- Node.js v18+
- PostgreSQL database
- Git

### Steps
1. **Clone Repository**:
   ```bash
   git clone https://github.com/amdadislam01/level_2-assingment-6.git
   cd level_2-assingment-6
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and configure credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:password@localhost:5432/project_saas?schema=public"
   JWT_ACCESS_SECRET="your-access-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   STRIPE_SECRET_KEY="sk_test_..."
   ```

4. **Run Prisma Migrations & Seed Database**:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment Instructions

### Deploying to Vercel Serverless
1. Install Vercel CLI or connect repository on [vercel.com](https://vercel.com).
2. Configure Environment Variables (`DATABASE_URL`, `JWT_ACCESS_SECRET`, etc.).
3. Deploy:
   ```bash
   vercel --prod
   ```

---

## 📝 License
This project is submitted for Level 2 Assignment 6 evaluation under standard academic/course guidelines.
