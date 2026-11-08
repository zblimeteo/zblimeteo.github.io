import assert from 'node:assert/strict';
import { visitorRequest } from '../db/visitor-request.ts';
import { readVisitorSnapshot } from '../db/visitor-client.ts';
import { readBrowserCountry } from '../db/visitor-geolocation.ts';
import { visitorIdentity } from '../db/visitor-identity.ts';

// Reproduce mobile engines missing newer APIs. These tests never contact a site.
const any = AbortSignal.any;
const timeout = AbortSignal.timeout;
const throwIfAborted = AbortSignal.prototype.throwIfAborted;
const randomUUID = crypto.randomUUID;
const signal = new AbortController().signal;
const snapshot = { total: 1, locations: [{ countryCode: 'CN', country: 'China', visits: 1 }] };
try {
  AbortSignal.any = undefined;
  AbortSignal.timeout = undefined;
  AbortSignal.prototype.throwIfAborted = undefined;
  crypto.randomUUID = undefined;
  let calls = 0;
  assert.deepEqual(await readVisitorSnapshot('/api/visit', signal, async () => {
    calls++;
    return Response.json(snapshot);
  }), snapshot);
  assert.equal(calls, 1);
  assert.equal(await readBrowserCountry('/cdn-cgi/trace', signal,
    async () => new Response('loc=CN\n')), 'CN');
  // A blocked HTML response must never be treated as a registration or total.
  await assert.rejects(readVisitorSnapshot('/api/visit', signal,
    async () => new Response('Sorry, you have been blocked', { status: 403 }),
    async () => {}), /unavailable/);
  let requestAborted = false;
  await assert.rejects(visitorRequest('/slow', signal, 10, response => response.json(),
    async (_url, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => {
        requestAborted = true;
        reject(new Error('Timed out'));
      });
    })), /Timed out/);
  assert.equal(requestAborted, true);
  // Parent cancellation still stops the in-flight request.
  const parent = new AbortController();
  const pending = visitorRequest('/cancelled', parent.signal, 1000, response => response.json(),
    async (_url, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('Cancelled')));
      parent.abort();
    }));
  await assert.rejects(pending, /Cancelled/);
  // Durable browser identity survives reload without randomUUID or Web Locks.
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  globalThis.sessionStorage = globalThis.localStorage;
  globalThis.document = { cookie: '' };
  globalThis.location = { protocol: 'https:' };
  const first = await visitorIdentity();
  assert.match(first, /^[a-f0-9]{32}$/);
  assert.equal(await visitorIdentity(), first);
  // An existing ID is retained during the upgrade.
  values.set('zb-visitor-id', 'existing-profile-id-123456');
  assert.equal(await visitorIdentity(), 'existing-profile-id-123456');
} finally {
  AbortSignal.any = any;
  AbortSignal.timeout = timeout;
  AbortSignal.prototype.throwIfAborted = throwIfAborted;
  crypto.randomUUID = randomUUID;
}
console.log('Mobile regression checks passed: requests and CN lookup work without new AbortSignal APIs; blocked responses fail; timeout/cancellation work; secure identities survive reload and preserve existing IDs.');
