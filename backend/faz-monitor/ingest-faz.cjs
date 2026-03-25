require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');

// ⭐ ADD THIS LINE
const geoip = require("geoip-lite");

const LOG_FILE = '/var/log/faz/faz.log';

// Use Atlas URI from .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/querytel_monitor';

// Force DB name (Atlas = Quby, local = querytel_monitor)
const DB_NAME = process.env.MONGO_DB || (MONGO_URI.includes("mongodb+srv") ? "Quby" : "querytel_monitor");
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "logs";

function detectCategory(log) {
    const msg = (log.message || log.msg || "").toLowerCase();
    const service = (log.service || "").toLowerCase();

    if (msg.includes("ssl") || service.includes("ssl")) return "SSL";
    if (msg.includes("dns") || service.includes("dns")) return "DNS";
    if (msg.includes("app-ctrl")) return "Application Control";
    if (msg.includes("utm") || msg.includes("ips")) return "IPS";
    if (msg.includes("webfilter") || msg.includes("url")) return "Web Filter";
    if (msg.includes("vpn") || msg.includes("dialup")) return "VPN";
    if (msg.includes("login") && msg.includes("failed")) return "Failed Login";
    if (msg.includes("admin")) return "Admin Access";

    return "General Traffic";
}

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
    const coll = db.collection(MONGO_COLLECTION);

    console.log(`[ingest] Connected to MongoDB at ${MONGO_URI}, DB=${DB_NAME}`);
    console.log(`[ingest] Watching ${LOG_FILE} for new FAZ logs...`);

    const tail = spawn('tail', ['-F', '-n0', LOG_FILE], { stdio: ['ignore', 'pipe', 'inherit'] });
    const rl = readline.createInterface({ input: tail.stdout });

    rl.on('line', async (line) => {
      try {
        const doc = parseKeyValue(line);

        // 🕒 Convert FAZ timestamp to Date object
        if (doc.date && doc.time) {
          doc.ts = new Date(`${doc.date}T${doc.time}`);
        } else {
          doc.ts = new Date();
        }

        doc.ingested_at = new Date();

        // 🛡️ Basic Normalization for SOC Dashboard compatibility
        doc.deviceName = doc.devname || "Unknown Device";
        doc.severity = (doc.level || doc.severity || "info").toLowerCase();
        doc.category = detectCategory(doc);
        doc.sourceIp = doc.srcip || null;
        doc.destIp = doc.dstip || null;
        doc.service = doc.service || doc.app || "N/A";
        doc.action = doc.action || "N/A";

        // ⭐ ADD COUNTRY LOOKUP HERE
        if (doc.sourceIp) {
          const lookup = geoip.lookup(doc.sourceIp);
          doc.country = lookup?.country || "Unknown";
          doc.srcCountry = doc.country;
          doc.srcLat = lookup?.ll?.[0] || null;
          doc.srcLng = lookup?.ll?.[1] || null;
        } else {
          doc.country = "Unknown";
          doc.srcCountry = "Unknown";
          doc.srcLat = null;
          doc.srcLng = null;
        }

        if (doc.destIp) {
          const lookup = geoip.lookup(doc.destIp);
          doc.destCountry = lookup?.country || "Unknown";
          doc.dstLat = lookup?.ll?.[0] || null;
          doc.dstLng = lookup?.ll?.[1] || null;
        } else {
          doc.destCountry = "Unknown";
          doc.dstLat = null;
          doc.dstLng = null;
        }

        console.log("[ingest] New log line parsed and normalized:", {
          ts: doc.ts,
          deviceName: doc.deviceName,
          severity: doc.severity,
          category: doc.category
        });

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
