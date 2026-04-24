type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  accessToken?: string;
  retries?: number;
  backoffMs?: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
}

function getApiBaseUrl(): string {
  const base = process.env.API_HOST;
  if (!base) throw new Error('API_HOST environment variable is not set');
  return base.replace(/\/$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number | undefined, error: unknown): boolean {
  if (error) return true;
  if (typeof status !== 'number') return true;
  if (status >= 500 || status === 429) return true;
  return false;
}

export async function apiFetch<T = unknown>(options: ApiClientOptions): Promise<ApiResponse<T>> {
  const {
    method = 'POST',
    path,
    body,
    formData,
    headers = {},
    accessToken,
    retries = 3,
    backoffMs = 1000,
  } = options;

  const url = `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  let lastError: unknown;
  let attempt = 0;

  while (attempt < retries) {
    attempt += 1;
    try {
      const mergedHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...headers,
      };
      if (!formData) mergedHeaders['Content-Type'] = 'application/json';
      if (accessToken) mergedHeaders.Authorization = `Bearer ${accessToken}`;

      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json().catch(() => undefined) : undefined;

      if (!response.ok) {
        if (shouldRetry(response.status, undefined) && attempt < retries) {
          await sleep(backoffMs);
          continue;
        }
        return { ok: false, status: response.status, error: payload };
      }

      return { ok: true, status: response.status, data: payload as T };
    } catch (error) {
      lastError = error;
      if (shouldRetry(undefined, error) && attempt < retries) {
        await sleep(backoffMs);
        continue;
      }
      return { ok: false, status: 0, error };
    }
  }

  return { ok: false, status: 0, error: lastError };
}
