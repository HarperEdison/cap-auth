export interface JwtAuthClaims {
  userId: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_verified: boolean;
  username: string | null;
  exp: number;
  iat: number;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenFresh(payload: { exp?: number }, bufferSeconds = 0): boolean {
  if (typeof payload.exp !== 'number') return false;
  return payload.exp - Math.floor(Date.now() / 1000) > bufferSeconds;
}

export function getValidTokenClaims(token: string, bufferSeconds = 0): JwtAuthClaims | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null;
  if (!isTokenFresh(payload as { exp: number }, bufferSeconds)) return null;
  if (typeof payload.phone_verified !== 'boolean' || !('username' in payload)) return null;
  return payload as unknown as JwtAuthClaims;
}
