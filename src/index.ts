export { getCookieDomain, getHostnameFromHeaders } from './auth/domain';
export {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  setAuthCookiesOnStore,
  clearAuthCookiesFromStore,
  COOKIE_NAMES,
} from './auth/cookies';
export { getAuthTokensFromRequest, getAuthTokensFromStore, hasAuthTokens, hasBothTokens } from './auth/tokens';
export type { AuthTokens } from './auth/tokens';
export { parseJwtPayload, isTokenFresh, getValidTokenClaims } from './auth/jwt';
export type { JwtAuthClaims } from './auth/jwt';

export { authenticateRequest, applyNewTokens, buildLoginRedirect } from './auth/middleware';
export type { MiddlewareAuthResult, MiddlewareAuthSuccess, MiddlewareAuthFailure } from './auth/middleware';

export { apiFetch } from './apiClient';
export type { ApiClientOptions, ApiResponse } from './apiClient';
export { protectedApiFetch } from './protectedApi';
export type { ProtectedRequestOptions, ProtectedResult } from './protectedApi';

export { authFetch, SessionExpiredError } from './authFetch';
