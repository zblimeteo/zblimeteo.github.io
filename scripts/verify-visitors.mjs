import assert from 'node:assert/strict';
import { traceCountry, validCountry, countryName, resolveVisitorCountry } from '../db/visitor-geolocation.ts';
import { recordVisit } from '../db/visitor-stats.ts';

assert.equal(traceCountry('ip=discarded\nloc=CN\ncolo=HKG\n'), 'CN');
assert.equal(countryName('CN'), 'China');
assert.equal(validCountry('XX'), '');
assert.equal(validCountry('ZZ'), '');
assert.equal(validCountry('T1'), '');
assert.equal(validCountry('<script>'), '');
assert.deepEqual(resolveVisitorCountry({countryCode:'CN',countrySource:'site_edge_trace'},'US'), {countryCode:'CN',countrySource:'site_edge_trace'});
assert.deepEqual(resolveVisitorCountry({countryCode:'',countrySource:'site_edge_trace'},'US'), {countryCode:'',countrySource:'unavailable'});
assert.equal(resolveVisitorCountry({},'SE').countryCode, 'SE');

const statements=[];
function db(changes) {
  return {prepare(sql) { statements.push(sql); return {bind(...args) { statements.push(args); return {async run(){return {meta:{changes}};}};}};}};
}
const visit={visitorKey:'test-existing-visitor',countryCode:'CN',country:'China',city:'',latitude:NaN,longitude:NaN,path:'/',countrySource:'site_edge_trace'};
await recordVisit(db(0),visit);
assert.equal(statements.filter(s=>typeof s==='string').length,1);
assert.match(statements[0],/INSERT OR IGNORE/);
assert.equal(statements[1][4],null);
assert.equal(statements[1][5],null);
statements.length=0;
await recordVisit(db(1),visit);
assert.equal(statements.filter(s=>typeof s==='string').length,2);
assert.match(statements[2],/visitor_country_sources/);
assert.equal(statements[3][1],'site_edge_trace');
console.log('Visitor checks passed: CN resolves to China; browser country beats proxy country; lookup failure stays unknown; existing records never overwritten; new country sources recorded.');
