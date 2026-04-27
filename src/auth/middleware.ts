import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '../apiClient';
import { getAuthTokensFromRequest } from './tokens';
import { getValidTokenClaims, type JwtAuthClaims } from './jwt';
import { setAuthCookies, clearAuthCookies } from './cookies';
import { getHostnameFromHeaders } from './domain';

export interface MiddlewareAuthSuccess {
  authenticated: true;
  user: JwtAuthClaims;
  newTokens?: { accessToken: string; refreshToken: string; expiresIn?: number };
}

export interface MiddlewareAuthFailure {
  authenticated: false;
  clearCookies: boolean;
}

export type MiddlewareAuthResult = MiddlewareAuthSuccess | MiddlewareAuthFailure;

type RefreshSuccess = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

const FRESHNESS_BUFFER_SECONDS = 120;

export async function authenticateRequest(request: NextRequest): Promise<MiddlewareAuthResult> {
  const { accessToken, refreshToken } = getAuthTokensFromRequest(request);

  if (!accessToken && !refreshToken) {
    return { authenticated: false, clearCookies: false };
  }

  if (accessToken) {
    const claims = getValidTokenClaims(accessToken, FRESHNESS_BUFFER_SECONDS);
    if (claims) {
      return { authenticated: true, user: claims };
    }
  }

  if (refreshToken) {
    const refresh = await apiFetch<RefreshSuccess>({
      method: 'POST',
      path: '/auth/refresh',
      body: { refresh_token: refreshToken },
    });

    if (refresh.ok && refresh.data) {
      const claims = getValidTokenClaims(refresh.data.access_token, 0);
      if (claims) {
        return {
          authenticated: true,
          user: claims,
          newTokens: {
            accessToken: refresh.data.access_token,
            refreshToken: refresh.data.refresh_token,
            expiresIn: refresh.data.expires_in,
          },
        };
      }
    }
  }

  return { authenticated: false, clearCookies: true };
}

export function applyNewTokens(response: NextResponse, auth: MiddlewareAuthSuccess, request: NextRequest): void {
  if (auth.newTokens) {
    const hostname = getHostnameFromHeaders(request.headers);
    setAuthCookies(response, auth.newTokens.accessToken, auth.newTokens.refreshToken, auth.newTokens.expiresIn, hostname);
  }
}

export function buildLoginRedirect(
  redirectUrl: string,
  request: NextRequest,
  options?: { clearCookies: boolean; loginPath?: string },
): NextResponse {
  const loginUrl = new URL(options?.loginPath ?? '/login', request.url);
  loginUrl.searchParams.set('redirect', redirectUrl);
  const response = NextResponse.redirect(loginUrl);
  if (options?.clearCookies) {
    clearAuthCookies(response, getHostnameFromHeaders(request.headers));
  }
  return response;
}
