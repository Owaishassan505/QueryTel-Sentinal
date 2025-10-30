require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');

const LOG_FILE = '/var/log/faz/faz.log';

// Use Atlas URI from .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/querytel_monitor';

// Force DB name (Atlas = Quby, local = querytel_monitor)
const DB_NAME = MONGO_URI.includes("mongodb+srv") ? "Quby" : "querytel_monitor";

function parseKeyValue(line) {
  const doc = {};
  const regex = /(\w+)=("[^"]*"|\S+)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    let key = match[1];
    let value = match[2];

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    doc[key] = value;
  }
  return doc;
}

(async () => {
  try {
    const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });
    await client.connect();
    const db = client.db(DB_NAME);
    const coll = db.collection('faz_events');

    console.log(`[ingest] Connected to MongoDB at ${MONGO_URI}, DB=${DB_NAME}`);
    console.log(`[ingest] Watching ${LOG_FILE} for new FAZ logs...`);

    const tail = spawn('tail', ['-F', '-n0', LOG_FILE], { stdio: ['ignore', 'pipe', 'inherit'] });
    const rl = readline.createInterface({ input: tail.stdout });

    rl.on('line', async (line) => {
      try {
        const doc = parseKeyValue(line);
        doc.ingested_at = new Date();

        if (doc.severity) {
          doc.severity = doc.severity.toLowerCase();
        }

        console.log("[ingest] New log line parsed:", doc);

        await coll.insertOne(doc);
        console.log("[ingest] Inserted into MongoDB");

        if (doc.severity === 'critical' || doc.severity === 'high') {
          console.log('[ALERT]', doc.devname, doc.srcip, '->', doc.dstip, '|', doc.severity, doc.msg || '');
        }

      } catch (err) {
        console.error('[ingest] Parse/Insert error:', err.message);
      }
    });

    tail.on('close', (code) => {
      console.log(`[ingest] tail closed with code ${code}`);
      client.close().catch(() => { });
      process.exit(code || 0);
    });

  } catch (err) {
    console.error("[ingest] MongoDB connection error:", err.message);
    process.exit(1);
  }
})();
