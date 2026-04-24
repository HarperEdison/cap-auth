import { NextRequest } from 'next/server';
import { COOKIE_NAMES } from './cookies';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export function getAuthTokensFromRequest(request: NextRequest): AuthTokens {
  return {
    accessToken: request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value ?? null,
    refreshToken: request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value ?? null,
  };
}

export function getAuthTokensFromStore(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): AuthTokens {
  return {
    accessToken: cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value ?? null,
    refreshToken: cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value ?? null,
  };
}

export function hasAuthTokens(tokens: AuthTokens): boolean {
  return tokens.accessToken !== null || tokens.refreshToken !== null;
}

export function hasBothTokens(tokens: AuthTokens): boolean {
  return tokens.accessToken !== null && tokens.refreshToken !== null;
}
