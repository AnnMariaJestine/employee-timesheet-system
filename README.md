# Employee Timesheet Management System

A full-stack employee timesheet management system built with **FastAPI**, **React**, and **PostgreSQL**. Supports three roles — Admin, Manager, and Employee — with project assignment, timesheet submission/approval workflows, and role-based dashboards.

## Tech Stack

- **Backend:** FastAPI (Python), SQLAlchemy ORM, JWT authentication, bcrypt password hashing
- **Frontend:** React (Vite)
- **Database:** PostgreSQL

## Features

### Admin
- Create and manage departments (with code, active/inactive status)
- Create and manage projects (with client name, start date, end date, active/inactive status)
- Create users and assign roles (Admin / Manager / Employee)
- Assign managers to employees
- Assign projects to users
- Activate/deactivate user accounts
- Reset any user's password
- Dashboard: active users, active projects, departments, total hours logged this month

### Manager
- View timesheet entries submitted by direct reports
- Filter by employee, project, status, and date range
- Approve or reject entries (rejection requires a comment)
- Dashboard: team size, pending review count, approved/rejected counts

### Employee
- View assigned projects
- Create timesheet entries (date, project, hours, description)
- Hours validation: 0.5–12 hours per entry, max 12 hours/day across all entries
- Edit or delete draft entries
- Submit entries for approval
- View rejection comments and resubmit
- Dashboard: draft/submitted/approved/rejected counts, hours logged this week

## Project Structure

```
timesheet-app/
├── backend/
│   ├── app/
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT auth, password hashing, role checks
│   │   ├── database.py        # DB connection/session setup
│   │   ├── main.py            # FastAPI app entrypoint
│   │   └── routers/
│   │       ├── auth_router.py
│   │       ├── admin.py
│   │       ├── manager.py
│   │       └── employee.py
│   ├── seed.py                 # Seeds initial test accounts
│   ├── migration_add_fields.sql
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/               # Login, AdminDashboard, ManagerDashboard, EmployeeDashboard
        ├── components/          # Navbar, StatusBadge, ProtectedRoute
        ├── api.js               # Axios instance
        └── theme.js             # Shared color/style tokens
```

## Setup Instructions

### 1. Database

Create a PostgreSQL database:
```sql
CREATE DATABASE timesheet_db;
```

Run the schema (tables are auto-created by SQLAlchemy on first backend startup), then apply:
```bash
psql -U postgres -d timesheet_db -f backend/migration_add_fields.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt --break-system-packages
```

Copy `.env.example` to `.env` and set your database URL:
```
DATABASE_URL=postgresql+psycopg2://postgres:<your_password>@localhost:5432/timesheet_db
SECRET_KEY=<any_random_string>
```

Seed initial accounts:
```bash
python seed.py
```

Start the server:
```bash
uvicorn app.main:app --reload
```
Backend runs at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Test Credentials

| Role     | Email            | Password     |
|----------|------------------|--------------|
| Admin    | admin@123.com    | Admin@123    |
| Manager  | manager@test.com | Manager@123  |
| Employee | employee@test.com| Employee@123 |

> **Note:** When creating new employees via the Admin dashboard, remember to set their **Manager** field — timesheet entries only appear on a manager's dashboard for employees linked to them via `manager_id`.

## Database Migration

`backend/migration_add_fields.sql` adds fields introduced after the initial schema (department codes/status, project client/date fields). Run it against any existing database that predates these fields.
