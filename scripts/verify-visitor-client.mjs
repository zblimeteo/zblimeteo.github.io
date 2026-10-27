import assert from 'node:assert/strict';
import { readVisitorSnapshot, validSnapshot, validSavedSnapshot } from '../db/visitor-client.ts';

const snapshot = { total: 3, locations: [{ countryCode: 'CN', country: 'China', visits: 3, city: '', latitude: null, longitude: null }] };
const signal = new AbortController().signal;
const options = [];
let calls = 0;
const recovered = await readVisitorSnapshot('/api/visit', signal, async (_url, request) => {
  options.push(request);
  calls++;
  if (calls === 1) throw new TypeError('temporary network failure');
  if (calls === 2) return new Response('Unavailable', { status: 503 });
  return Response.json(snapshot);
}, async () => {});
assert.deepEqual(recovered, snapshot);
assert.equal(calls, 3);
assert.ok(options.every(request => !request.method || request.method === 'GET'));
assert.ok(options.every(request => request.credentials === 'omit'));
assert.equal(validSnapshot({ ...snapshot, total: 8 }), false);
assert.equal(validSavedSnapshot({ capturedAt: 'invalid', snapshot }), false);
assert.equal(validSavedSnapshot({ capturedAt: '2026-10-27T09:00:00Z', snapshot }), true);
calls = 0;
await assert.rejects(readVisitorSnapshot('/api/visit', signal, async () => { calls++; return Response.json({ total: 3, locations: [] }); }, async () => {}), /Invalid visitor statistics/);
assert.equal(calls, 3);
const aborted = new AbortController();
aborted.abort();
calls = 0;
await assert.rejects(readVisitorSnapshot('/api/visit', aborted.signal, async () => { calls++; return Response.json(snapshot); }, async () => {}));
assert.equal(calls, 0);
const bodies = [];
const body = JSON.stringify({ visitorId: 'same-browser-id-12345', countryCode: 'CN', countrySource: 'site_edge_trace' });
await readVisitorSnapshot('/api/visit', signal, async (_url, request) => {
  bodies.push(request.body);
  assert.equal(request.method, 'POST');
  if (bodies.length < 3) throw new TypeError('temporary failure');
  return Response.json(snapshot);
}, async () => {}, { method: 'POST', body, headers: { 'content-type': 'application/json' } });
assert.deepEqual(bodies, [body, body, body]);
console.log('Visitor client checks passed: temporary failures recover; invalid totals rejected; bounded retries; cancellation stops requests; dated cache validated; recording retries retain the same visitor ID.');
