import { NextResponse } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { getCookieDomain } from './domain';

const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 15 * 60;
const DEFAULT_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getBaseCookieOptions(hostname?: string): Partial<ResponseCookie> {
  const domain = hostname ? getCookieDomain(hostname) : undefined;
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'none',
    path: '/',
    domain,
  };
}

export function getAccessTokenCookieOptions(config?: { maxAge?: number; hostname?: string }): Partial<ResponseCookie> {
  const maxAge = config?.maxAge !== undefined
    ? Math.max(0, Math.floor(config.maxAge))
    : DEFAULT_ACCESS_TOKEN_MAX_AGE;
  return { ...getBaseCookieOptions(config?.hostname), maxAge };
}

export function getRefreshTokenCookieOptions(config?: { hostname?: string }): Partial<ResponseCookie> {
  return { ...getBaseCookieOptions(config?.hostname), maxAge: DEFAULT_REFRESH_TOKEN_MAX_AGE };
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
  hostname?: string,
): void {
  const accessMaxAge = Number.isFinite(expiresIn) ? expiresIn : undefined;
  response.cookies.set(ACCESS_TOKEN_NAME, accessToken, getAccessTokenCookieOptions({ maxAge: accessMaxAge, hostname }));
  response.cookies.set(REFRESH_TOKEN_NAME, refreshToken, getRefreshTokenCookieOptions({ hostname }));
}

export function clearAuthCookies(response: NextResponse, hostname?: string): void {
  const domain = hostname ? getCookieDomain(hostname) : undefined;
  response.cookies.delete({ name: ACCESS_TOKEN_NAME, path: '/', domain });
  response.cookies.delete({ name: REFRESH_TOKEN_NAME, path: '/', domain });
}

export function setAuthCookiesOnStore(
  cookieStore: { set: (name: string, value: string, options?: Partial<ResponseCookie>) => void },
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
  hostname?: string,
): void {
  const accessMaxAge = Number.isFinite(expiresIn) ? expiresIn : undefined;
  cookieStore.set(ACCESS_TOKEN_NAME, accessToken, getAccessTokenCookieOptions({ maxAge: accessMaxAge, hostname }));
  cookieStore.set(REFRESH_TOKEN_NAME, refreshToken, getRefreshTokenCookieOptions({ hostname }));
}

export function clearAuthCookiesFromStore(
  cookieStore: { delete: (...args: any[]) => any },
  hostname?: string,
): void {
  const domain = hostname ? getCookieDomain(hostname) : undefined;
  if (domain) {
    cookieStore.delete({ name: ACCESS_TOKEN_NAME, path: '/', domain } as any);
    cookieStore.delete({ name: REFRESH_TOKEN_NAME, path: '/', domain } as any);
  } else {
    cookieStore.delete(ACCESS_TOKEN_NAME);
    cookieStore.delete(REFRESH_TOKEN_NAME);
  }
}

export const COOKIE_NAMES = {
  ACCESS_TOKEN: ACCESS_TOKEN_NAME,
  REFRESH_TOKEN: REFRESH_TOKEN_NAME,
} as const;
