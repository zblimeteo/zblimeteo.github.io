import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { recordVisit, getVisitorSnapshot } from '../db/visitor-stats.ts';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
for (const statement of readFileSync(new URL('../drizzle/0000_glorious_crystal.sql', import.meta.url), 'utf8').split('--> statement-breakpoint')) sqlite.exec(statement);
const database = {
  prepare(query) {
    return { bind(...values) { return { query, values }; },
      async first() { return sqlite.prepare(query).get(); },
      async all() { return { results: sqlite.prepare(query).all() }; },
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results = statements.map(statement => ({ meta: { changes: sqlite.prepare(statement.query).run(...statement.values).changes } }));
      sqlite.exec('COMMIT');
      return results;
    } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  },
};
const base = { visitorKey:'same-browser-profile',countryCode:'CN',country:'China',countrySource:'site_edge_trace',city:'',latitude:NaN,longitude:NaN,path:'/' };
await Promise.all(Array.from({length:100}, () => recordVisit(database, base)));
assert.equal((await getVisitorSnapshot(database)).total, 1);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM visitor_country_sources').get().count, 1);
sqlite.exec("UPDATE unique_visitors_v3 SET visited_at='2020-01-01 00:00:00'");
await recordVisit(database, {...base,countryCode:'US',country:'United States',path:'/publications.html'});
assert.equal((await getVisitorSnapshot(database)).total, 1);
assert.equal(sqlite.prepare('SELECT country_code FROM unique_visitors_v3').get().country_code, 'CN');
await recordVisit(database, {...base,visitorKey:'initially-unknown-browser',countryCode:'',country:'',countrySource:'unavailable'});
await recordVisit(database, {...base,visitorKey:'initially-unknown-browser'});
assert.equal((await getVisitorSnapshot(database)).total, 2);
assert.equal(sqlite.prepare("SELECT country_code FROM unique_visitors_v3 WHERE visitor_key='initially-unknown-browser'").get().country_code, 'CN');
assert.equal(sqlite.prepare("SELECT source FROM visitor_country_sources WHERE visitor_key='initially-unknown-browser'").get().source, 'site_edge_trace');
await recordVisit(database, {...base,visitorKey:'different-browser-same-network'});
assert.equal((await getVisitorSnapshot(database)).total, 3);
sqlite.exec("INSERT INTO unique_visitors_v3 (visitor_key,country_code,country,path) VALUES ('legacy-us-browser','US','United States','/')");
await recordVisit(database, {...base,visitorKey:'legacy-us-browser'});
assert.equal(sqlite.prepare("SELECT country_code FROM unique_visitors_v3 WHERE visitor_key='legacy-us-browser'").get().country_code, 'US');
assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM visitor_country_sources WHERE visitor_key='legacy-us-browser'").get().count, 0);
sqlite.exec("CREATE TRIGGER simulate_storage_failure BEFORE INSERT ON visitor_country_sources WHEN NEW.visitor_key='failed-transaction-browser' BEGIN SELECT RAISE(ABORT, 'simulated source write failure'); END");
await assert.rejects(recordVisit(database, {...base,visitorKey:'failed-transaction-browser'}));
assert.equal((await getVisitorSnapshot(database)).total, 4);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM unique_visitors_v3 WHERE visitor_key='failed-transaction-browser'").get().count, 0);
assert.equal((await getVisitorSnapshot(database)).locations.reduce((sum,row)=>sum+row.visits,0), 4);
sqlite.close();
console.log('SQLite checks passed: 100 duplicate submissions count once; cross-day and cross-page visits do not add rows; unknown country can become CN without increasing total; distinct browsers stay distinct; legacy countries retained; failed batches roll back.');
