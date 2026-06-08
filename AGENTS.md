# BudgetApp — Agent Guidelines

Personal finance tracker with a .NET 8 minimal-API backend and a Next.js 16 frontend.

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
```

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

## Domain Quick Reference

- **CategoryType**: `Income = 1`, `Expense = 2`
- **IncomeEntry**: Amount, Source, Notes, ReceivedOn (DateOnly), CategoryId
- **ExpenseEntry**: Amount, Merchant, Notes, SpentOn (DateOnly), CategoryId
- **Reports**: aggregated on demand — monthly and daily breakdowns by category