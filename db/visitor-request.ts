// Keep visitor requests usable in mobile browsers that have AbortController but
// not AbortSignal.any(), timeout(), or throwIfAborted().
export function checkVisitorAbort(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason ?? new Error('Visitor request aborted');
}

export async function visitorRequest<T>(
  endpoint: string,
  parent: AbortSignal,
  timeoutMs: number,
  read: (response: Response) => Promise<T>,
  fetcher: typeof fetch = fetch,
  options: RequestInit = {},
): Promise<T> {
  checkVisitorAbort(parent);
  const controller = new AbortController();
  const abort = () => controller.abort();
  parent.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetcher(endpoint, { ...options, signal: controller.signal });
    // The deadline includes reading the body, not just receiving the headers.
    return await read(response);
  } finally {
    clearTimeout(timer);
    parent.removeEventListener('abort', abort);
  }
}
