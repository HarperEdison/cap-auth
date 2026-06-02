import { cookies, headers } from 'next/headers';
import { type ApiResponse } from './apiClient';
import { protectedApiFetch } from './protectedApi';
import { getAuthTokensFromStore } from './auth/tokens';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ServerApiOptions {
  method?: Method;
  path: string;
  body?: unknown;
}

export async function fetchCurrentUserRole(): Promise<string> {
  const result = await serverApiFetch<{ role?: string }>({ path: '/auth/me' });
  return result.ok ? (result.data?.role || 'USER') : 'USER';
}

export async function serverApiFetch<T = unknown>(options: ServerApiOptions): Promise<ApiResponse<T>> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const { accessToken, refreshToken } = getAuthTokensFromStore(cookieStore);
  const result = await protectedApiFetch<T>({
    method: options.method ?? 'GET',
    path: options.path,
    body: options.body,
    accessToken,
    refreshToken,
    traceId: headerStore.get('x-amzn-trace-id') ?? undefined,
  });
  return { ok: result.ok, status: result.status, data: result.data, error: result.error };
}
