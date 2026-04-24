# cap-auth — Shared Auth Library

Shared authentication utilities for cap-frontend and cap-admin.
This is a source-only TypeScript package — no build step.
Consuming Next.js apps transpile it via `transpilePackages`.

## Setup

### In package.json:
```json
"@cap/auth": "file:../cap-auth"
```

### In next.config.ts:
```typescript
transpilePackages: ['@cap/auth']
```

### In tsconfig.json:
```json
"paths": {
  "@cap/auth": ["../cap-auth/src/index.ts"],
  "@cap/auth/*": ["../cap-auth/src/*"],
  "next": ["./node_modules/next"],
  "next/*": ["./node_modules/next/*"]
},
"include": ["...", "../cap-auth/src/**/*.ts"]
```

## Entry Points

### `@cap/auth` — Edge-safe and client-safe
Cookie utilities, token helpers, domain helpers, JWT parsing, apiClient, protectedApi, authFetch.
```typescript
import { apiFetch, protectedApiFetch, authFetch, getCookieDomain, parseJwtPayload, setAuthCookiesOnStore } from '@cap/auth';
```

### `@cap/auth/route-handler` — Server-only (uses `next/headers`)
Route handler wrappers with optional role check.
```typescript
// Default (no role check):
import { withProtectedRoute, makeProtectedApiCall, createErrorResponse } from '@cap/auth/route-handler';

// With role check (admin):
import { createProtectedRouteHandlers } from '@cap/auth/route-handler';
const { withProtectedRoute, makeProtectedApiCall, createErrorResponse } = createProtectedRouteHandlers({ requiredRole: 'ADMIN' });
```

### `@cap/auth/server` — Server components only (uses `next/headers`)
```typescript
import { serverApiFetch, fetchCurrentUserRole } from '@cap/auth/server';
```

## Do NOT import in middleware
- `@cap/auth/route-handler` (uses `next/headers`)
- `@cap/auth/server` (uses `next/headers`)

Middleware should import directly from `@cap/auth` (the barrel) or `@cap/auth/protectedApi`.
