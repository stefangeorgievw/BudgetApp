# BudgetApp

BudgetApp is a full-stack personal finance tracker built with a .NET 8 minimal API backend and a Next.js 16 frontend. It supports category management, income and expense tracking, and daily or monthly reporting.

## Overview

- Backend: ASP.NET Core minimal APIs with EF Core and SQLite
- Frontend: Next.js App Router, React 19, TypeScript, Tailwind CSS 4
- Testing: xUnit for backend endpoints, Playwright for frontend end-to-end coverage
- Local defaults: frontend on `http://localhost:3000`, backend on `http://localhost:5100`

## Features

- Separate income and expense categories
- Create, update, list, and delete income entries
- Create, update, list, and delete expense entries
- Monthly reporting with expense breakdown by category
- Daily reporting for a selected date
- Seeded local database for development startup

## Repository Layout

```text
.
|-- backend/
|   |-- src/IWallet.Api/          # .NET 8 minimal API, EF Core, SQLite
|   `-- tests/IWallet.Api.Tests/  # xUnit endpoint tests
|-- frontend/
|   |-- src/app/                  # Next.js App Router pages
|   |-- src/components/           # UI components
|   |-- src/lib/                  # API client and shared types
|   `-- tests/                    # Playwright end-to-end tests
|-- AGENTS.md                     # Repo-specific engineering guidance
`-- NuGet.Config
```

## Architecture

### Backend

The backend lives in `backend/src/IWallet.Api` and uses a vertical-slice structure:

- `Domain/` contains the core entities: categories, income entries, and expense entries.
- `Features/` contains endpoint slices for categories, income, expenses, and reports.
- `Infrastructure/Persistence/` contains the EF Core `AppDbContext` and seed logic.

On startup, the API:

- configures SQLite via EF Core
- enables CORS for `http://localhost:3000`
- exposes Swagger UI in development
- ensures the database exists and seeds initial data

### Frontend

The frontend lives in `frontend/src` and uses the Next.js App Router.

- `app/` contains route-driven pages for dashboard, income, expenses, and reports.
- `components/` contains reusable UI for forms, tables, layout, and report views.
- `lib/api.ts` centralizes all backend HTTP requests.
- `lib/types.ts` mirrors the backend DTO shapes in TypeScript.

The frontend reads the backend base URL from `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://localhost:5100`.

## Prerequisites

- .NET SDK 8
- Node.js 20 or later
- npm

## Getting Started

### 1. Restore backend dependencies

```powershell
dotnet restore backend/IWallet.sln
```

### 2. Install frontend dependencies

```powershell
cd frontend
npm install
```

### 3. Run the backend

```powershell
cd backend/src/IWallet.Api
dotnet run
```

The API will be available at `http://localhost:5100`.

In development, Swagger UI is available from the running backend host.

### 4. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Environment Configuration

The frontend can target a different backend by setting:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5100
```

Add that value to `frontend/.env.local` if you need to override the default.

## Testing

### Backend tests

```powershell
dotnet test backend/tests/IWallet.Api.Tests/IWallet.Api.Tests.csproj
```

These tests cover endpoint behavior such as:

- category filtering and sorting
- income create, update, delete, and validation flows
- expense filtering and validation flows
- daily and monthly report aggregation

### Frontend lint

```powershell
cd frontend
npm run lint
```

### Frontend end-to-end tests

```powershell
cd frontend
npm run test:e2e
```

The Playwright suite uses mocked API responses, so it usually does not require the backend to be running.

## Build Commands

### Backend build

```powershell
dotnet build backend/src/IWallet.Api/IWallet.Api.csproj
```

### Frontend production build

```powershell
cd frontend
npm run build
```

## API Surface

The backend exposes these main route groups:

- `/api/health`
- `/api/categories`
- `/api/income`
- `/api/expenses`
- `/api/reports/monthly`
- `/api/reports/daily`

## Development Notes

- The local SQLite database is created automatically on startup.
- The development database file is stored under `backend/src/IWallet.Api/iwallet.dev.db`.
- Read operations use DTOs mirrored in the frontend under `frontend/src/lib/types.ts`.
- The frontend uses `cache: "no-store"` for API requests.

## Tech Stack

- ASP.NET Core 8 minimal APIs
- Entity Framework Core 8
- SQLite
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- xUnit
- Playwright
