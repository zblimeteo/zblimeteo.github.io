export function validCountry(value: unknown): string {
  if (typeof value !== 'string') return '';
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'ZZ' || code === 'T1') return '';
  try {
    const region = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' }).of(code);
    return region ? code : '';
  } catch { return ''; }
}

export function traceCountry(trace: string): string {
  return validCountry(trace.split(/\r?\n/).find(line => line.startsWith('loc='))?.slice(4));
}

export function countryName(code: string): string {
  return code ? new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code : 'Unknown location';
}

export function resolveVisitorCountry(body: { countryCode?: string; countrySource?: string }, edgeCountry?: string) {
  const browserLookup = body.countrySource === 'site_edge_trace';
  const countryCode = validCountry(browserLookup ? body.countryCode : edgeCountry);
  return { countryCode, countrySource: countryCode ? (browserLookup ? 'site_edge_trace' : 'cloudflare_request') : 'unavailable' };
}
