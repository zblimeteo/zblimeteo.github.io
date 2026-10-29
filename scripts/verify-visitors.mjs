import assert from 'node:assert/strict';
import { traceCountry, validCountry, countryName, resolveVisitorCountry, readBrowserCountry, knownAutomation } from '../db/visitor-geolocation.ts';

assert.equal(traceCountry('ip=discarded\nloc=CN\ncolo=HKG\n'), 'CN');
assert.equal(countryName('CN'), 'China');
assert.equal(validCountry('XX'), '');
assert.equal(validCountry('ZZ'), '');
assert.equal(validCountry('T1'), '');
assert.equal(validCountry('<script>'), '');
assert.deepEqual(resolveVisitorCountry({countryCode:'CN',countrySource:'site_edge_trace'},'US'), {countryCode:'CN',countrySource:'site_edge_trace'});
assert.deepEqual(resolveVisitorCountry({countryCode:'',countrySource:'site_edge_trace'},'US'), {countryCode:'',countrySource:'unavailable'});
assert.equal(resolveVisitorCountry({},'US').countryCode, '');
assert.equal(resolveVisitorCountry({countryCode:'CN'},'US').countryCode, '');
assert.equal(knownAutomation('CloudflareBrowserRenderingCrawler/1.0'), true);
assert.equal(knownAutomation('Mozilla/5.0 HeadlessChrome/130.0'), true);
assert.equal(knownAutomation('Mozilla/5.0 Chrome/130.0', true), true);
assert.equal(knownAutomation('Mozilla/5.0 Chrome/130.0'), false);

let requests = 0;
const country = await readBrowserCountry('https://existing-backend/cdn-cgi/trace', new AbortController().signal, async () => {
  requests++;
  if (requests === 1) throw new TypeError('temporary failure');
  return new Response('loc=CN\ncolo=HKG\n');
});
assert.equal(country, 'CN');
assert.equal(requests, 2);
assert.equal(await readBrowserCountry('https://existing-backend/cdn-cgi/trace', new AbortController().signal, async () => new Response('loc=XX\n')), '');
console.log('Geolocation checks passed: CN resolves to China after a transient failure; forwarding countries never substitute for visitors; failed lookups stay unknown; known automation excluded.');
