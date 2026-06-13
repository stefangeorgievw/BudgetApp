# BudgetApp — Agent Guidelines

Personal finance tracker with a .NET 8 minimal-API backend and a Next.js 16 frontend.

Use this file as the first-stop operating guide for repo-aware edits. Prefer narrow, behavior-scoped changes and validate the touched slice before widening scope.

## Architecture

```
backend/src/IWallet.Api/   — ASP.NET Core minimal APIs, SQLite via EF Core
  Domain/                  — Sealed entity classes (Category, IncomeEntry, ExpenseEntry)
  Features/                — Vertical slices: Categories, Expenses, Income, Reports
  Infrastructure/Persistence/ — AppDbContext + DataSeeder
frontend/src/              — Next.js 16 App Router, TypeScript strict, Tailwind CSS 4
  app/                     — Pages and layouts (file-based routing)
  components/              — UI components grouped by domain concern
  lib/api.ts               — All backend calls; single generic apiRequest<T> wrapper
  lib/types.ts             — TypeScript interfaces mirroring backend DTOs
```

## Build & Run

```powershell
# Backend  (runs on http://localhost:5100)
cd backend/src/IWallet.Api
dotnet run

# Frontend  (runs on http://localhost:3000)
cd frontend
npm run dev

# Validate backend only
dotnet build backend/src/IWallet.Api/IWallet.Api.csproj

# Run backend endpoint tests
dotnet test backend/tests/IWallet.Api.Tests/IWallet.Api.Tests.csproj

# Validate frontend linting
cd frontend
npm run lint

# Run frontend e2e tests
cd frontend
npm run test:e2e
```

## Validation Order

- For backend endpoint or persistence changes, prefer `dotnet test backend/tests/IWallet.Api.Tests/IWallet.Api.Tests.csproj`.
- For backend-only structural changes without a close test, run `dotnet build backend/src/IWallet.Api/IWallet.Api.csproj`.
- For frontend component or page changes, prefer `npm run lint` from `frontend/`.
- For end-to-end UX changes, run `npm run test:e2e` from `frontend/`.
- Do not default to broad full-stack runs when a narrower check exists.

## Backend Conventions

| Concern | Pattern |
|---------|---------|
| Classes & records | `sealed` everywhere |
| DTOs | `sealed record` with `*Dto` suffix |
| Request bodies | `sealed record` named `Upsert*Request` (covers create & update) |
| Endpoint registration | Static extension methods on `IEndpointRouteBuilder` per feature |
| EF queries | `.AsNoTracking()` for read-only paths; `CancellationToken` on all DB ops |
| Validation errors | `Results.ValidationProblem()` with field-level messages |
| Money | `decimal` columns configured as `(18,2)`; sort decimal fields **after** materializing (SQLite limitation) |
| Dates | `DateOnly` — no time component |

- Nullable reference types are enabled globally (`<Nullable>enable</Nullable>`).
- Category type must match entry type — an Expense entry requires an Expense category.
- `DeleteBehavior.Restrict` on all foreign keys (no cascade deletes).
- App startup calls `EnsureCreatedAsync()` and `DataSeeder.SeedAsync()`; development uses the local SQLite file `backend/src/IWallet.Api/iwallet.dev.db`.
- CORS is configured for `http://localhost:3000`; keep local frontend/backend defaults aligned unless the task explicitly changes environment wiring.

## Frontend Conventions

| Concern | Pattern |
|---------|---------|
| Components | Functional + TypeScript; add `"use client"` only when interactive |
| State | `useState` / local state only — no external state library |
| API calls | Centralized in `src/lib/api.ts`; use `apiRequest<T>` |
| Styling | Tailwind classes + CSS variables (`--ink-strong`, `--paper`, `--line`, `--muted`, etc.) |
| Fonts | `--font-work-sans` (body), `--font-playfair` (headings) |
| Dates to API | ISO strings `YYYY-MM-DD`; use `toDateQuery()` helper |
| Currency display | `formatCurrency()` from `src/lib/api.ts` |

- The `EntryForm` component is polymorphic — pass `kind: "income" | "expense"` to adapt labels.
- `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:5100`; override in `.env.local` if needed.
- All fetch calls use `cache: "no-store"`.
- Playwright runs from `frontend/tests/` and starts its own Next dev server on `127.0.0.1:3000`.
- Frontend test automation uses route-mocked API responses; most e2e runs do not require the backend to be running.

## Edit Heuristics

- Keep backend work inside the owning feature slice before touching shared infrastructure.
- Add or update API calls in `frontend/src/lib/api.ts`; keep page and component files free of ad hoc fetch logic.
- Update `frontend/src/lib/types.ts` when backend DTO shapes change.
- Preserve existing naming and sealed-type conventions rather than introducing parallel patterns.
- Avoid incidental refactors unless they are required to complete the requested change safely.

## Domain Quick Reference

- **CategoryType**: `Income = 1`, `Expense = 2`
- **IncomeEntry**: Amount, Source, Notes, ReceivedOn (DateOnly), CategoryId
- **ExpenseEntry**: Amount, Merchant, Notes, SpentOn (DateOnly), CategoryId
- **Reports**: aggregated on demand — monthly and daily breakdowns by category