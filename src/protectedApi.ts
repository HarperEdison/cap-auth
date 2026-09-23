import { apiFetch } from './apiClient';

export interface ProtectedRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  formData?: FormData;
  accessToken?: string | null;
  refreshToken?: string | null;
  /** Incoming X-Amzn-Trace-Id, forwarded to cap-api so its logs share a trace_id. */
  traceId?: string;
  /** Browser session id (cfa_sid), forwarded so cap-api can group a visit. */
  sessionId?: string;
}

export interface ProtectedResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
  newAccessToken?: string;
  newRefreshToken?: string;
  expiresIn?: number;
}

type RefreshSuccess = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function protectedApiFetch<T = unknown>(
  options: ProtectedRequestOptions,
): Promise<ProtectedResult<T>> {
  const { method = 'GET', path, body, formData, accessToken, refreshToken, traceId, sessionId } = options;
  // Forward both correlation keys to cap-api: the trace ties this one hop
  // together, the session ties every hop of the visit together.
  const headers: Record<string, string> | undefined =
    traceId || sessionId
      ? {
          ...(traceId ? { 'X-Amzn-Trace-Id': traceId } : {}),
          ...(sessionId ? { 'X-CFA-Session': sessionId } : {}),
        }
      : undefined;

  const initial = await apiFetch<T>({ method, path, body, formData, accessToken: accessToken ?? undefined, headers });
  if (initial.ok) {
    return { ok: true, status: initial.status, data: initial.data };
  }

  if (initial.status !== 401) {
    return { ok: false, status: initial.status, error: initial.error };
  }

  if (!refreshToken) {
    return { ok: false, status: 401, error: initial.error };
  }

  const refresh = await apiFetch<RefreshSuccess>({
    method: 'POST',
    path: '/auth/refresh',
    body: { refresh_token: refreshToken },
    headers,
  });

  if (!refresh.ok) {
    return { ok: false, status: refresh.status, error: refresh.error };
  }

  const tokens = refresh.data as RefreshSuccess;

  const retry = await apiFetch<T>({ method, path, body, formData, accessToken: tokens.access_token, headers });
  if (!retry.ok) {
    return { ok: false, status: retry.status, error: retry.error };
  }

  return {
    ok: true,
    status: retry.status,
    data: retry.data,
    newAccessToken: tokens.access_token,
    newRefreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}
