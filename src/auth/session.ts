import type { NextRequest, NextResponse } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { getCookieDomain } from './domain';

/**
 * Browser session id, used purely to group log lines into a visit.
 *
 * `trace_id` identifies a single HTTP request — the ALB stamps a fresh one on
 * every hop — so it can never answer "what did this person do today". This
 * cookie can: it is stable across requests, survives navigation, and is present
 * for anonymous visitors, who otherwise leave no correlatable identity at all.
 *
 * It carries no personal data: a random uuid, never joined to anything outside
 * the logs, on a rolling 30-minute idle window so a visit ends when the person
 * stops browsing rather than persisting as a long-lived tracking id.
 */
export const SESSION_COOKIE_NAME = 'cfa_sid';

/** Idle window. Refreshed on every response, so it slides while the visit is active. */
export const SESSION_MAX_AGE = 30 * 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getSessionCookieOptions(hostname?: string): Partial<ResponseCookie> {
  return {
    // Not readable from JS: nothing in the browser needs it, and httpOnly keeps
    // it out of reach of anything injected into the page.
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    domain: hostname ? getCookieDomain(hostname) : undefined,
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Read the current session id, if the visitor already has one.
 *
 * The cookie is client-supplied, so only accept it if it matches the shape
 * we mint (a uuid). Otherwise a visitor could put arbitrary strings into
 * cap-api logs, or spoof another visitor's id to pollute their log grouping.
 */
export function getSessionId(request: NextRequest): string | undefined {
  const value = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return value && UUID_PATTERN.test(value) ? value : undefined;
}

/**
 * The visitor's session id, minting one if this is the first request of a
 * visit. Always returns a value, so callers can log it unconditionally.
 */
export function resolveSessionId(request: NextRequest): string {
  return getSessionId(request) ?? crypto.randomUUID();
}

/**
 * Write the session cookie onto a response. Called on every response rather
 * than only on the first, which is what makes the 30-minute window roll.
 */
export function setSessionCookie(
  response: NextResponse,
  sessionId: string,
  hostname?: string,
): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(hostname));
}
