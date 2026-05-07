function isIPv4(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function isIPv6(hostname: string): boolean {
  return hostname.includes(':');
}

export function getCookieDomain(hostname: string | undefined | null): string | undefined {
  if (!hostname) return undefined;
  const host = hostname.split(':')[0];
  if (host === 'lvh.me' || host.endsWith('.lvh.me')) return '.lvh.me';
  if (host === 'localhost' || host === '127.0.0.1') return undefined;
  if (isIPv4(host) || isIPv6(host)) return undefined;
  const parts = host.split('.');
  if (parts.length < 2) return undefined;
  if (parts.length === 2) return `.${host}`;
  return `.${parts.slice(1).join('.')}`;
}

export function getHostnameFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-host') || headers.get('host') || undefined;
}
