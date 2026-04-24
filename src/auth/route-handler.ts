import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { protectedApiFetch, type ProtectedResult } from '../protectedApi';
import { getAuthTokensFromStore, type AuthTokens } from './tokens';
import { setAuthCookiesOnStore } from './cookies';
import { getHostnameFromHeaders } from './domain';
import { parseJwtPayload } from './jwt';

export interface RouteHandlerConfig {
  requiredRole?: string;
}

interface RouteContext {
  params?: Promise<Record<string, string>>;
}

export interface ProtectedRouteContext {
  tokens: AuthTokens;
  request: NextRequest;
  params?: Promise<Record<string, string>>;
}

type ProtectedRouteHandler<T> = (
  context: ProtectedRouteContext,
) => Promise<NextResponse<T> | Response>;

interface ProtectedApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  formData?: FormData;
}

function buildWithProtectedRoute(config?: RouteHandlerConfig) {
  return function withProtectedRoute<T = unknown>(
    handler: ProtectedRouteHandler<T>,
  ): (request: NextRequest) => Promise<NextResponse<T> | Response> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js passes route context as second arg; we forward it to the handler
    return async (request: NextRequest, ...[context]: [RouteContext?]) => {
      const cookieStore = await cookies();
      const tokens = getAuthTokensFromStore(cookieStore);

      if (!tokens.accessToken && !tokens.refreshToken) {
        return NextResponse.json(
          { statusCode: 401, message: 'Missing authentication tokens' },
          { status: 401 },
        );
      }

      if (config?.requiredRole && tokens.accessToken) {
        const payload = parseJwtPayload(tokens.accessToken);
        if (!payload || payload.role !== config.requiredRole) {
          return NextResponse.json(
            { statusCode: 403, message: `${config.requiredRole} access required` },
            { status: 403 },
          );
        }
      }

      try {
        return await handler({ tokens, request, params: context?.params });
      } catch (error) {
        console.error('[withProtectedRoute] Error:', error);
        return NextResponse.json(
          { statusCode: 500, message: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 },
        ) as NextResponse<T>;
      }
    };
  };
}

export async function makeProtectedApiCall<T>(
  tokens: AuthTokens,
  options: ProtectedApiCallOptions,
  request?: NextRequest,
): Promise<{
  result: ProtectedResult<T>;
  updateCookies: (response: NextResponse) => void;
}> {
  const result = await protectedApiFetch<T>({
    method: options.method || 'GET',
    path: options.path,
    body: options.body,
    formData: options.formData,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  const hostname = request ? getHostnameFromHeaders(request.headers) : undefined;

  const updateCookies = (response: NextResponse) => {
    if (result.newAccessToken && result.newRefreshToken) {
      setAuthCookiesOnStore(response.cookies, result.newAccessToken, result.newRefreshToken, result.expiresIn, hostname);
    }
  };

  return { result, updateCookies };
}

export function createErrorResponse(status: number, message: string, path: string, method: string): NextResponse {
  return NextResponse.json({ statusCode: status, message, path, method }, { status });
}

export function createProtectedRouteHandlers(config?: RouteHandlerConfig) {
  return {
    withProtectedRoute: buildWithProtectedRoute(config),
    makeProtectedApiCall,
    createErrorResponse,
  };
}

export const withProtectedRoute = buildWithProtectedRoute();
