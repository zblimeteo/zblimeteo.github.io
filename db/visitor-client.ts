import type { VisitorSnapshot } from './visitor-stats';

export type SavedVisitorSnapshot = { capturedAt: string; snapshot: VisitorSnapshot };

export function validSnapshot(value: unknown): value is VisitorSnapshot {
  if (!value || typeof value !== 'object') return false;
  const data = value as VisitorSnapshot;
  return Number.isInteger(data.total) && data.total >= 0 && Array.isArray(data.locations)
    && data.locations.every(item => item && typeof item.country === 'string' && typeof item.countryCode === 'string' && Number.isInteger(item.visits) && item.visits >= 0)
    && data.locations.reduce((sum, item) => sum + item.visits, 0) === data.total;
}

export function validSavedSnapshot(value: unknown): value is SavedVisitorSnapshot {
  if (!value || typeof value !== 'object') return false;
  const data = value as SavedVisitorSnapshot;
  return typeof data.capturedAt === 'string' && Number.isFinite(Date.parse(data.capturedAt)) && validSnapshot(data.snapshot);
}

export async function readVisitorSnapshot(endpoint: string, signal: AbortSignal, fetcher: typeof fetch = fetch, pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)), request: RequestInit = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal.throwIfAborted();
    try {
      const response = await fetcher(endpoint, { ...request, mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
      if (!response.ok) throw new Error('Visitor statistics unavailable');
      const snapshot: unknown = await response.json();
      if (!validSnapshot(snapshot)) throw new Error('Invalid visitor statistics');
      return snapshot;
    } catch (error) {
      if (signal.aborted || attempt === 2) throw error;
      await pause(1000 * (attempt + 1));
    }
  }
  throw new Error('Visitor statistics unavailable');
}
