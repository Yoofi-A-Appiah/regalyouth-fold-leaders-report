#!/usr/bin/env node
/**
 * Load scripts/import-data.json (produced by xlsx-to-json.py) into MongoDB,
 * replacing the leaders/unassigned/events/attendance/prayerList/submissions
 * collections that db.ts reads from. needsInfoList is left alone -- there's
 * no source data for it in the spreadsheet.
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-to-mongo.mjs scripts/import-data.json
 */
import { readFileSync } from 'fs';
import { MongoClient } from 'mongodb';

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node --env-file=.env.local scripts/import-to-mongo.mjs <import-data.json>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
  console.error('MONGODB_URI is not set (or still has <db_username>/<db_password> placeholders) in .env.local');
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));

const client = new MongoClient(uri);
await client.connect();
const db = client.db('regalyouth');

async function replace(collection, docs) {
  await db.collection(collection).deleteMany({});
  if (docs.length > 0) await db.collection(collection).insertMany(docs);
  console.log(`  ${collection}: ${docs.length} documents`);
}

console.log('Replacing collections in MongoDB (regalyouth):');
await replace('leaders', data.leaders);
await replace('unassigned', data.unassigned);
await replace('events', data.events);
await replace('attendance', data.attendance);
await replace('prayerList', data.prayerList);
await replace('submissions', data.submissions);

await client.close();
console.log('\nDone.');
