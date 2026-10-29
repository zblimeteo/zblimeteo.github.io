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
  // Sites can forward requests through a different network. Never use that
  // forwarding layer's country as the visitor's location, including old clients.
  void edgeCountry;
  const countryCode = validCountry(browserLookup ? body.countryCode : '');
  return { countryCode, countrySource: countryCode ? 'site_edge_trace' : 'unavailable' };
}

export function knownAutomation(userAgent: string, webdriver = false) {
  return webdriver || /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|GPTBot|OAI-SearchBot|ChatGPT-User|crawler|spider|HeadlessChrome|lighthouse|PageSpeed/i.test(userAgent);
}

export async function readBrowserCountry(endpoint: string, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    try {
      const response = await fetcher(endpoint, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]) });
      if (response.ok) {
        const country = traceCountry(await response.text());
        if (country) return country;
      }
    } catch (error) { if (signal.aborted) throw error; }
  }
  return '';
}
