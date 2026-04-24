# cap-auth — Shared Auth Library

Shared authentication utilities for cap-frontend and cap-admin.
Built with `tsc` and installed from GitHub via npm.

## Setup

### In consuming project's package.json:
```json
"@cap/auth": "github:HarperEdison/cap-auth"
```

No `transpilePackages`, tsconfig path overrides, or turbopack root hacks needed — the package ships compiled JS and declaration files.

### Local development

To iterate on cap-auth with live rebuilds:
```bash
cd repos/cap-auth && npm run dev   # watches src/ and rebuilds dist/
```

Consumers resolve `@cap/auth` from node_modules. Use `npm link` for local development:
```bash
cd repos/cap-auth && npm link
cd repos/cap-frontend && npm link @cap/auth
```

## Building

```bash
npm run build       # one-shot build to dist/
npm run dev         # watch mode
npm run typecheck   # type-check without emitting
```

The `prepare` script runs `tsc` automatically when npm installs from GitHub.

## Entry Points

### `@cap/auth` — Edge-safe and client-safe
Cookie utilities, token helpers, domain helpers, JWT parsing, apiClient, protectedApi, authFetch.
```typescript
import { apiFetch, protectedApiFetch, authFetch, getCookieDomain, parseJwtPayload, setAuthCookies, clearAuthCookies } from '@cap/auth';
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
