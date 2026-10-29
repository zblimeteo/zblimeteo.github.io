const identityKey = 'zb-visitor-id';
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9-]{16,80}$/.test(value);

function existingId() {
  try { const id = localStorage.getItem(identityKey); if (validId(id)) return id; } catch {}
  try { const id = document.cookie.split('; ').find(part => part.startsWith(`${identityKey}=`))?.slice(identityKey.length + 1); if (validId(id)) return id; } catch {}
  try { const id = sessionStorage.getItem(identityKey); if (validId(id)) return id; } catch {}
  return null;
}

function persistId(id: string) {
  let persistent = false;
  try { localStorage.setItem(identityKey, id); persistent = localStorage.getItem(identityKey) === id; } catch {}
  try {
    document.cookie = `${identityKey}=${id}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    persistent ||= document.cookie.split('; ').includes(`${identityKey}=${id}`);
  } catch {}
  try { sessionStorage.setItem(identityKey, id); } catch {}
  return persistent;
}

// A read/write transaction serializes first visits across tabs even on browsers
// without Web Locks. Existing identifiers are retained when adding this backup.
function indexedId(candidate: string): Promise<string | null> {
  return new Promise(resolve => {
    let finished = false;
    const finish = (id: string | null) => { if (!finished) { finished = true; clearTimeout(timer); resolve(id); } };
    const timer = setTimeout(() => finish(null), 2500);
    try {
      const opening = indexedDB.open('zb-visitor-identity', 1);
      opening.onupgradeneeded = () => { opening.result.createObjectStore('identity'); };
      opening.onerror = () => finish(null);
      opening.onblocked = () => finish(null);
      opening.onsuccess = () => {
        const db = opening.result;
        if (finished) { db.close(); return; }
        const transaction = db.transaction('identity', 'readwrite');
        const store = transaction.objectStore('identity');
        const reading = store.get('visitor');
        let selected = candidate;
        reading.onsuccess = () => { selected = validId(reading.result) ? reading.result : candidate; store.put(selected, 'visitor'); };
        transaction.oncomplete = () => { db.close(); finish(selected); };
        transaction.onabort = transaction.onerror = () => { db.close(); finish(null); };
      };
    } catch { finish(null); }
  });
}

export async function visitorIdentity(): Promise<string | null> {
  const resolve = async () => {
    const candidate = existingId() ?? crypto.randomUUID();
    const indexed = await indexedId(candidate);
    const selected = indexed ?? candidate;
    const persistent = persistId(selected);
    // A fresh ID with no durable storage would count every reload as a new person.
    return indexed || persistent ? selected : null;
  };
  if (navigator.locks?.request) {
    try { return await navigator.locks.request('zb-visitor-identity', { signal: AbortSignal.timeout(6000) }, resolve); }
    catch { return null; }
  }
  return resolve();
}
