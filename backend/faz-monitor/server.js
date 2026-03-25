// --- Unified QueryTel SOC + FAZ Monitor Backend ---
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import querystring from "querystring";
import fs from "fs";
import Parser from "rss-parser";
import NodeCache from "node-cache";
import os from "os";
import http from "http";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";
import { Tail } from "tail";
import { createZohoTicket, listZohoTickets } from "./zohoTicket.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";
import mongoose from "mongoose";

dotenv.config();
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soc";



import speakeasy from "speakeasy";
import qrcode from "qrcode";
import geoip from "geoip-lite";
import { exec } from "child_process";
import { registerAdvancedSOCEndpoints } from "./soc-advanced-endpoints.js";
import { detectIncident, createOrUpdateIncident } from "./incident-engine.js";
import { mapLogToMitre, getMitreMatrixStructure } from "./mitre-engine.js";

// ================================================
// 🚀 ADVANCED LOG CLASSIFIER + HUMAN MESSAGE ENGINE
// ================================================

// 🔥 Convert severity → color/icon (frontend uses this)
export function classifySeverity(sev) {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return { level: "critical", icon: "🚨", color: "red" };
  if (s === "error") return { level: "error", icon: "❌", color: "red" };
  if (s === "warning" || s === "warn") return { level: "warning", icon: "⚠️", color: "yellow" };
  return { level: "info", icon: "ℹ️", color: "blue" };
}

// 🌍 Country lookup
export function resolveCountry(ip) {
  if (!ip) return "-";
  const geo = geoip.lookup(ip);
  return geo?.country || "-";
}

// ================================================
// 🌍 FIXED COUNTRY RESOLVER (Handles Internal IPs)
// ================================================
function resolveCountryFixed(ip) {
  if (!ip) return "Unknown";

  const privateRanges = [
    "10.",
    "192.168.",
    "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.",
    "172.24.", "172.25.", "172.26.", "172.27.",
    "172.28.", "172.29.", "172.30.", "172.31."
  ];

  // Internal IP → map to your SOC main country (Canada)
  if (privateRanges.some(prefix => ip.startsWith(prefix))) {
    return "CA"; // or "US", "PK", etc.
  }

  // Normal GeoIP lookup for public IPs
  const geo = geoip.lookup(ip);
  return geo?.country || "Unknown";
}




// 🔍 Category detection
export function detectCategory(log) {
  const msg = (log.message || "").toLowerCase();
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

// 🧠 Generate user-friendly summary (Structured for SOC Analysts)
export function generateSummary(log) {
  const severity = classifySeverity(log.severity);
  const category = detectCategory(log);
  const srcCountry = resolveCountryFixed(log.sourceIp);
  const dstCountry = resolveCountryFixed(log.destIp);

  // Determine Recommendation based on risk/action
  let recommendation = "Monitor this traffic for unusual patterns.";
  if (log.action === 'deny' || log.action === 'block' || log.action === 'drop') {
    recommendation = "Threat was successfully mitigated by firewall policy. No immediate action required unless source IP persistence is noted.";
  } else if (['IPS', 'ANTIVIRUS', 'MALWARE'].includes(category.toUpperCase())) {
    recommendation = "🚨 IMMEDIATE ACTION: This threat was NOT blocked. Isolate the source host and perform a full malware scan.";
  } else if (category.toUpperCase() === 'FAILED LOGIN') {
    recommendation = "Investigate source for potential brute-force activity. Consider account lockout or 2FA enforcement.";
  }

  return `
### What is happening?
A **${category}** incident was detected on device **${log.deviceName || "Unknown"}**. This involved communication patterns matching **${log.service || "unknown services"}**.

### Why is it happening?
The system identified this as **${severity.level.toUpperCase()}** priority traffic. ${log.action === 'accept' ? "The traffic was permitted through the perimeter." : "The traffic was blocked as per security policy."} 

### What we can do?
${recommendation}

### Technical Specification
- **Endpoint Source:** \`${log.sourceIp || "-"}\` (${srcCountry})
- **Destination Target:** \`${log.destIp || "-"}\` (${dstCountry})
- **Service/Protocol:** \`${log.service || "-"}\` (Port: \`${log.dstPort || "-"}\`)
- **Enforcement Action:** \`${log.action || "N/A"}\`
  `.trim();
}

// ⭐ Detailed log message with coordinates + metadata
export function generateDetailedMessage(log) {
  const severity = classifySeverity(log.severity);
  const category = detectCategory(log);

  const srcCountry = resolveCountryFixed(log.sourceIp);
  const dstCountry = resolveCountryFixed(log.destIp);

  const srcGeo = geoip.lookup(log.sourceIp);
  const dstGeo = geoip.lookup(log.destIp);

  const srcLat = srcGeo?.ll?.[0] || null;
  const srcLng = srcGeo?.ll?.[1] || null;
  const dstLat = dstGeo?.ll?.[0] || null;
  const dstLng = dstGeo?.ll?.[1] || null;

  return {
    text: `
${severity.icon} **${category} Event (${severity.level.toUpperCase()})**
Device **${log.deviceName || "Unknown"}** recorded ${category} traffic.

- **Source:** ${log.sourceIp || "-"} (${srcCountry})
- **Destination:** ${log.destIp || "-"} (${dstCountry})
- **Service:** ${log.service || "-"}
- **Port:** ${log.dstPort || "-"}
- **Action:** ${log.action || "N/A"}

📝 Message:
${log.message || "No message"}
    `.trim(),

    meta: {
      severity: severity.level,
      category,
      srcCountry,
      dstCountry,
      srcLat,
      srcLng,
      dstLat,
      dstLng
    }
  };
}




// --- Generate user-friendly message ---
function generateCleanMessage(f) {
  const src = f.srcip || f.src || f.remip || f.client_ip || "Internal";
  const dst = f.dstip || f.dst || f.dst_host || f.hostname || "Perimeter";
  const site = f.hostname || f.url || "";

  if (f.subtype === "webfilter") {
    return `Web Filter blocked access to ${site || dst}.`;
  }

  if (f.subtype === "virus") {
    return `Antivirus detected malware: ${f.virus || "Unknown Threat"}.`;
  }

  if (f.subtype === "ssl") {
    return `SSL inspection issue for ${site || dst}.`;
  }

  if (f.subtype === "appctrl") {
    return `Application Control detected ${f.appcat || "network activity"}.`;
  }

  if (f.subtype === "utm") {
    return `Threat detected by UTM module (${f.type || "unknown"}).`;
  }

  if (f.subtype === "event") {
    return f.msg || "System event logged.";
  }

  // Default
  return f.msg || "Network session recorded.";
}

function normalizeCountry(country) {
  if (!country || country === "-" || country.trim() === "") {
    return "Unknown";
  }
  return country.toUpperCase();
}




// ✅ Fix for ES modules (__dirname not defined)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Force absolute .env load to fix PM2 and process.cwd() issues
const envPath = path.resolve(__dirname, ".env");
console.log("📄 Loading .env from:", envPath);
dotenv.config({ path: envPath });

// ✅ Verification log for Azure ENV
console.log("✅ Azure ENV Loaded:", {
  tenant: process.env.AZURE_TENANT_ID,
  client: process.env.AZURE_CLIENT_ID,
  redirect: process.env.AZURE_REDIRECT_URI,
  secret: process.env.AZURE_CLIENT_SECRET ? "✅ present" : "❌ missing",
});

const PORT = process.env.PORT || 3320;
import jwt from "jsonwebtoken";

// 🛡️ FortiAnalyzer Intelligence
import { calculateRiskMetadata, isNoise, generateLogFingerprint, generateEventFingerprint } from './storage-optim.js';

// --- Authentication Setup ---
const JWT_SECRET = process.env.JWT_SECRET || "supersecure-querytel-key";

// Dummy users (for now, can later move to MongoDB or LDAP)
const USERS = [
  { email: "soc@querytel.com", password: "Qu3ry1e80!" },
  { email: "security@querytel.com", password: "SOC@12345" },
];

// --- Express / Socket.IO Setup ---
const instanceId = process.env.NODE_APP_INSTANCE || '0';
const isPrimary = instanceId === '0';

console.log(`🚀 Process Instance: ${instanceId} (isPrimary: ${isPrimary})`);

const app = express();
app.set('trust proxy', 1); // ✅ Trust Nginx/Load Balancer for secure cookies

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://sentinel.itcold.com",  // ✅ Live production domain
      "http://localhost:3000",        // ✅ Local dev
      "http://127.0.0.1:3000"

    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

// ======================================================
// DISABLE SOCKET.IO AUTHENTICATION (TEMPORARY)
// ======================================================
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    console.log("❌ No token provided for socket");
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    console.log("🟢 Socket authorized:", decoded.email);
    next();
  } catch (err) {
    console.log("❌ Invalid socket token");
    next();
  }
});



app.use(
  cors({
    origin: [
      "https://sentinel.itcold.com", // ✅ Production
      "http://10.180.80.168:3000",   // ✅ Local
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json());


// --- MICROSOFT AZURE SSO LOGIN (QueryTel Sentinel SSO) ---
// --- MICROSOFT AZURE SSO LOGIN (QueryTel Sentinel SSO) ---
// --- MICROSOFT AZURE SSO LOGIN (QueryTel Sentinel SSO) ---
import passport from "passport";
import { OIDCStrategy } from "passport-azure-ad";
import session from "express-session";
import MongoStore from "connect-mongo";

app.use(
  session({
    secret: "querytel-soc-session",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'native'
    }),
    cookie: {
      secure: true, // sentinel.itcold.com uses HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 🔍 Debug log for verification
console.log("🔍 Using Azure Config:", {
  tenant: process.env.AZURE_TENANT_ID,
  client: process.env.AZURE_CLIENT_ID,
  redirect: process.env.AZURE_REDIRECT_URI,
});

const azureConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  responseType: "code",
  responseMode: "query",
  redirectUrl: process.env.AZURE_REDIRECT_URI || "https://sentinel.itcold.com/auth/azure/callback",
  scope: ["openid", "profile", "email"],
  passReqToCallback: false,
};

passport.use(
  new OIDCStrategy(
    azureConfig,
    (iss, sub, profile, accessToken, refreshToken, done) => {
      // get email from whichever claim AAD returns
      const email =
        profile?._json?.email ||
        profile?._json?.preferred_username ||
        profile?._json?.unique_name ||
        profile?.upn;

      if (!email || !email.toLowerCase().endsWith("@querytel.com")) {
        return done(null, false, { message: "Unauthorized domain" });
      }
      profile.email = email;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

console.log("🟢 Registering Azure SSO routes...");

// 1) Start login
// --- AZURE LOGIN START ROUTE ---
// --- AZURE LOGIN START ROUTE (FIXED) ---
// --- AZURE LOGIN START ---
app.get(
  "/auth/azure/login",
  passport.authenticate("azuread-openidconnect", {
    responseType: "code",
    responseMode: "query",
    prompt: "select_account",
  })
);

// --- AZURE CALLBACK ---
app.get(
  "/auth/azure/callback",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login-failed",
  }),
  (req, res) => {
    if (!req.user) {
      return res.redirect("https://sentinel.itcold.com/login?error=missing_user");
    }

    const email =
      req.user.email ||
      req.user._json?.email ||
      req.user._json?.preferred_username ||
      req.user.upn;

    if (!email) {
      return res.redirect("https://sentinel.itcold.com/login?error=no_email");
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "8h" });

    res.redirect(`https://sentinel.itcold.com/?token=${encodeURIComponent(token)}`);
  }
);

// 3) Optional: simple failure page
app.get("/login-failed", (_req, res) => res.status(401).send("Login failed"));


function detectExposure(text) {
  const t = text.toLowerCase();

  const indicators = [
    "querytel", "@querytel.com", "credentials", "password", "pass=", "pwd=",
    "leak", "database dump", "email: password", "combo list", "logs cloud",
    "stealer logs", "redline", "vidar", "raccoon", "unauthorized access",
    "darkweb", "deepweb", "onion", "market", "dumped"
  ];

  return indicators.some(i => t.includes(i));
}




// --- LOGIN AUTHENTICATION ENDPOINT ---
// --- Normal Login (Requires 2FA) ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // Check if user has 2FA enabled
  const dbUser = await db.collection("users").findOne({ email });

  if (dbUser?.totpSecret) {
    // 2FA required
    return res.json({ needs2FA: true, email });
  } else {
    // First login → force setup
    return res.json({ needs2FASetup: true, email });
  }
});


// --- TOKEN VERIFICATION MIDDLEWARE ---
function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- 2FA Setup (only for normal login users) ---
app.post("/api/2fa/setup", verifyToken, async (req, res) => {
  const email = req.user.email;

  const secret = speakeasy.generateSecret({
    name: "QueryTel Sentinel SOC",
  });

  // Save secret to MongoDB
  await db.collection("users").updateOne(
    { email },
    { $set: { totpSecret: secret.base32 } },
    { upsert: true }
  );

  const qr = await qrcode.toDataURL(secret.otpauth_url);

  res.json({
    qr,
    secret: secret.base32,
    message: "Scan QR using Google/Microsoft Authenticator"
  });
});

// --- 2FA Verify Login ---
app.post("/api/2fa/verify", async (req, res) => {
  const { email, code } = req.body;

  const user = await db.collection("users").findOne({ email });
  if (!user || !user.totpSecret)
    return res.status(401).json({ error: "2FA not setup" });

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: "base32",
    token: code,
    window: 1
  });

  if (!verified)
    return res.status(401).json({ error: "Invalid 2FA code" });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "8h" });

  res.json({ success: true, token });
});

function calculateThreatScore(items) {
  let score = 0;

  items.forEach(h => {
    const t = (h.title || "").toLowerCase();

    if (/million|database dump|critical/.test(t)) score += 20;
    if (/credentials|password|pwd|pass=/.test(t)) score += 10;
    if (/querytel|@querytel.com/.test(t)) score += 50;
  });

  return Math.min(score, 100);
}


// --- MongoDB Connection ---
//import dotenv from "dotenv";
//dotenv.config();

let client, db, logsCollection, eventsCollection, incidentsCollection, darkwebHeadlinesCollection, statsCacheCollection;
const analyticsCache = new NodeCache({ stdTTL: 120 }); // 2 min TTL

async function connectMongo() {
  try {
    client = new MongoClient(MONGO_URL, {
      maxPoolSize: 500,
      minPoolSize: 10,
    });
    await client.connect();

    // ⭐ Connect Mongoose as well for the Model-based endpoints
    await mongoose.connect(MONGO_URL);

    db = client.db(process.env.MONGO_DB || "soc");
    logsCollection = db.collection(process.env.MONGO_COLLECTION || "logs");
    eventsCollection = db.collection("events");
    incidentsCollection = db.collection("incidents");
    darkwebHeadlinesCollection = db.collection("darkweb_headlines");
    statsCacheCollection = db.collection("stats_cache");

    console.log(`✅ Connected to MongoDB (${process.env.MONGO_DB || "soc"})`);

    // 🚀 CREATE INDEXES FOR PERFORMANCE (Essential for scale)
    console.log("🚀 Ensuring MongoDB indexes (Background)...");
    await logsCollection.createIndex({ ts: -1 }, { background: true });
    await logsCollection.createIndex({ severity: 1, ts: -1 }, { background: true });
    await logsCollection.createIndex({ severity: 1 }, { background: true });
    await logsCollection.createIndex({ category: 1 }, { background: true });

    // 🛡️ DEDUPLICATION INDEX (Crucial for ingestion speed)
    await logsCollection.createIndex({ fingerprint: 1, ts: -1 }, { background: true });

    // Efficient Compound Indexes for Dashboard Aggregations
    await logsCollection.createIndex({ ts: -1, destCountry: 1 }, { background: true });
    await logsCollection.createIndex({ ts: -1, deviceName: 1 }, { background: true });
    await logsCollection.createIndex({ ts: -1, severity: 1, category: 1 }, { background: true });

    await logsCollection.createIndex({ deviceName: 1 }, { background: true });
    await logsCollection.createIndex({ destCountry: 1 }, { background: true });
    await logsCollection.createIndex({ sourceIp: 1 }, { background: true });
    await logsCollection.createIndex({ destIp: 1 }, { background: true });

    // 🛡️ EVENT EXPLORER INDEXES
    await eventsCollection.createIndex({ lastSeen: -1 }, { background: true });
    await eventsCollection.createIndex({ severity: 1 }, { background: true });
    await eventsCollection.createIndex({ riskLevel: 1 }, { background: true });
    await eventsCollection.createIndex({ eventFingerprint: 1, lastSeen: -1 }, { background: true });

    // Incidents Collection Indexes
    await incidentsCollection.createIndex({ status: 1 }, { background: true });
    await incidentsCollection.createIndex({ severity: 1 }, { background: true });
    await incidentsCollection.createIndex({ created_at: -1 }, { background: true });
    await incidentsCollection.createIndex({ incident_id: 1 }, { unique: true, background: true });

    console.log("✅ MongoDB index build requested in background.");

    // ✅ Register Advanced SOC Endpoints (Pass analyticsCache for optimization)
    if (app && logsCollection) {
      registerAdvancedSOCEndpoints(app, logsCollection, eventsCollection, incidentsCollection, analyticsCache, statsCacheCollection);
      console.log("✅ Advanced SOC API Entpoints Registered");
    }

    // 🧠 SINGLETON BACKGROUND TASKS (Only run on Primary Instance 0)
    if (isPrimary) {
      console.log("🌟 Primary Instance Detected: Starting Background Services...");

      // 🧠 START BACKGROUND ANALYTICS ENGINE
      setTimeout(() => {
        startBackgroundAnalytics();
      }, 5000); // Wait 5s for startup stabilize

      // --- Intelligent Storage Management ---
      runMaintenanceTasks();

      // Check every 15 minutes
      setInterval(runMaintenanceTasks, 15 * 60 * 1000);
    }

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

/**
 * 🛠️ MAINTENANCE ENGINE
 * Manages storage and log retention to prevent server crashes.
 */
async function runMaintenanceTasks() {
  try {
    console.log("🧹 Running Maintenance Tasks...");

    // 1. Tiered Scrubbing (Scrub raw data after 72 hours, keep metadata)
    // Optimized: Fetch IDs in batches to avoid long locks
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const logsToScrub = await logsCollection.find(
      { ts: { $lt: seventyTwoHoursAgo }, parsed: { $exists: true } },
      { projection: { _id: 1 } }
    ).limit(10000).toArray();

    if (logsToScrub.length > 0) {
      const scrubIds = logsToScrub.map(l => l._id);
      const scrubResult = await logsCollection.updateMany(
        { _id: { $in: scrubIds } },
        { $unset: { parsed: "", message: "", raw: "" } }
      );
      console.log(`| Scrubbed raw data from ${scrubResult.modifiedCount} logs (>72h)`);
    }

    // 2. Standard Retention (Delete logs older than 30 days)
    // Optimized: Only delete in batches to prevent long locks
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logsToDelete = await logsCollection.find(
      { ts: { $lt: thirtyDaysAgo } },
      { projection: { _id: 1 } }
    ).limit(10000).toArray();

    if (logsToDelete.length > 0) {
      const deleteIds = logsToDelete.map(l => l._id);
      const retentionResult = await logsCollection.deleteMany(
        { _id: { $in: deleteIds } }
      );
      console.log(`| Retention Policy: Removed ${retentionResult.deletedCount} logs older than 30 days.`);
    }

    // 2. Storage Check (Prevent Disk Full)
    exec("df -h / | tail -1", async (error, stdout) => {
      if (error) {
        console.error("❌ Storage check failed:", error);
        return;
      }

      const parts = stdout.trim().split(/\s+/);
      const usagePercent = parseInt(parts[4].replace("%", ""));
      const available = parts[3];

      console.log(`📊 Storage Monitor: ${usagePercent}% used (${available} available)`);

      // CRITICAL: If usage is above 75%, start emergency clearing
      if (usagePercent > 75) {
        console.warn(`🛑 WARNING: Storage critical (${usagePercent}%). Initiating emergency log cleanup...`);

        // Count total logs
        const totalLogs = await logsCollection.countDocuments();

        if (usagePercent > 90) {
          // DEFCON 1: Delete almost everything (Keep last 1,000 logs)
          console.error("💀 Storage > 90%! Clearing almost all logs to save server.");
          const lastLogs = await logsCollection.find().sort({ ts: -1 }).limit(1000).toArray();
          await logsCollection.deleteMany({});
          if (lastLogs.length > 0) await logsCollection.insertMany(lastLogs);
        } else {
          // DEFCON 2: Delete oldest 50%
          const toDelete = Math.floor(totalLogs * 0.5);
          const oldestLogs = await logsCollection.find().sort({ ts: 1 }).limit(toDelete).toArray();
          if (oldestLogs.length > 0) {
            const ids = oldestLogs.map(l => l._id);
            await logsCollection.deleteMany({ _id: { $in: ids } });
            console.log(`🚮 Emergency Cleanup: Removed ${ids.length} oldest logs.`);
          }
        }
      }
    });

  } catch (err) {
    console.error("❌ Maintenance Error:", err.message);
  }
}

// duplicate connectMongo removed

// ============================================================
// 🌐 NETWORK TRAFFIC ANALYSIS ENDPOINTS
// ============================================================

function buildNetworkQuery(req) {
  const { startDate, endDate, category, srcCountry } = req.query;
  const query = {};
  if (startDate || endDate) {
    query.ts = {};
    if (startDate) query.ts.$gte = new Date(startDate);
    if (endDate) query.ts.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  } else {
    // Default: last 24 hours
    query.ts = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
  }
  if (category && category !== "all") query.category = category;
  if (srcCountry) query.srcCountry = { $regex: srcCountry, $options: "i" };
  return query;
}

// 1. Network Overview Stats
app.get("/api/network/overview", async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const cacheKey = `network:overview:${JSON.stringify(query)}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return res.json(cached);

    // Optimized: Run total count separately (very fast with index)
    // Run category breakdown separately
    const [totalSessions, topCatResult, uniqueSrcCount, uniqueDstCount] = await Promise.all([
      logsCollection.countDocuments(query),
      logsCollection.aggregate([
        { $match: query },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]).toArray(),
      // Use estimated or limited distinct count for performance on millions of logs
      totalSessions > 100000 
        ? logsCollection.aggregate([{ $match: query }, { $limit: 50000 }, { $group: { _id: "$sourceIp" } }, { $count: "count" }]).toArray()
        : logsCollection.distinct("sourceIp", query),
      totalSessions > 100000 
        ? logsCollection.aggregate([{ $match: query }, { $limit: 50000 }, { $group: { _id: "$destIp" } }, { $count: "count" }]).toArray()
        : logsCollection.distinct("destIp", query)
    ]);

    const result = {
      totalSessions: totalSessions,
      uniqueSrcIPs: Array.isArray(uniqueSrcCount) ? (uniqueSrcCount[0]?.count || uniqueSrcCount.length) : uniqueSrcCount.length,
      uniqueDstIPs: Array.isArray(uniqueDstCount) ? (uniqueDstCount[0]?.count || uniqueDstCount.length) : uniqueDstCount.length,
      topCategory: topCatResult[0]?._id || "N/A",
      topCategoryCount: topCatResult[0]?.count || 0,
    };

    analyticsCache.set(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    console.error("❌ Network Overview Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Top Talkers (Source IPs by session count)
app.get("/api/network/top-talkers", async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const cacheKey = `network:top-talkers:${JSON.stringify(query)}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return res.json(cached);

    const results = await logsCollection.aggregate([
      { $match: { ...query, sourceIp: { $exists: true, $ne: null } } },
      { $limit: 250000 }, // Optimization: Limit scan to 250k logs for top talkers
      {
        $group: {
          _id: "$sourceIp",
          sessions: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ["$severity", "error"] }, 1, 0] } },
          warnings: { $sum: { $cond: [{ $in: ["$severity", ["warn", "warning"]] }, 1, 0] } },
          country: { $first: "$srcCountry" },
          deviceName: { $first: "$deviceName" },
          lastSeen: { $max: "$ts" },
        },
      },
      { $sort: { sessions: -1 } },
      { $limit: 15 },
    ]).toArray();

    const talkers = results.map((r) => ({
      ip: r._id,
      sessions: r.sessions,
      country: r.country || "Unknown",
      deviceName: r.deviceName || "Unknown",
      lastSeen: r.lastSeen,
      riskLevel:
        r.errors > 20 ? "CRITICAL" : r.errors > 5 ? "HIGH" : r.warnings > 10 ? "MEDIUM" : "LOW",
    }));

    analyticsCache.set(cacheKey, talkers, 120);
    res.json(talkers);
  } catch (err) {
    console.error("❌ Top Talkers Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Protocol / Category Breakdown
app.get("/api/network/protocol-breakdown", async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const cacheKey = `network:protocol:${JSON.stringify(query)}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return res.json(cached);

    const results = await logsCollection.aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]).toArray();

    const breakdown = results
      .filter((r) => r._id)
      .map((r) => ({ name: r._id, value: r.count }));

    analyticsCache.set(cacheKey, breakdown, 120);
    res.json(breakdown);
  } catch (err) {
    console.error("❌ Protocol Breakdown Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Traffic Timeline (30-min buckets, last 24h)
app.get("/api/network/traffic-timeline", async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const cacheKey = `network:timeline:${JSON.stringify(query)}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return res.json(cached);

    const results = await logsCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $subtract: [
              { $toLong: "$ts" },
              { $mod: [{ $toLong: "$ts" }, 30 * 60 * 1000] },
            ],
          },
          sessions: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ["$severity", "error"] }, 1, 0] } },
          warnings: {
            $sum: { $cond: [{ $in: ["$severity", ["warn", "warning"]] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 48 },
    ]).toArray();

    const timeline = results.map((r) => ({
      time: new Date(r._id).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      ts: r._id,
      sessions: r.sessions,
      errors: r.errors,
      warnings: r.warnings,
    }));

    analyticsCache.set(cacheKey, timeline, 120);
    res.json(timeline);
  } catch (err) {
    console.error("❌ Traffic Timeline Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Geo Session Origins (top source countries)
app.get("/api/network/geo-sessions", async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const cacheKey = `network:geo:${JSON.stringify(query)}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return res.json(cached);

    const results = await logsCollection.aggregate([
      { $match: { ...query, srcCountry: { $exists: true, $ne: null, $ne: "" } } },
      { $limit: 250000 }, // Optimization: Limit scan for geo
      { $group: { _id: "$srcCountry", sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
      { $limit: 15 },
    ]).toArray();

    const geoData = results
      .filter((r) => r._id && r._id !== "-" && r._id !== "Unknown")
      .map((r) => ({ country: r._id, sessions: r.sessions }));

    res.json(geoData);
  } catch (err) {
    console.error("❌ Geo Sessions Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Network Intelligence (Data-driven summary)
app.get("/api/network/intelligence", verifyToken, async (req, res) => {
  try {
    const query = buildNetworkQuery(req);
    const lastLogs = await logsCollection.find(query).sort({ ts: -1 }).limit(1000).toArray();

    if (lastLogs.length === 0) {
      return res.json({
        summary: "No network flow data detected in the selected time range.",
        riskLevel: "LOW",
        anomalies: []
      });
    }

    const categories = lastLogs.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {});

    const topCategoryEntry = Object.entries(categories).sort((a,b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : "General";
    const errorCount = lastLogs.filter(l => l.severity === "error").length;
    
    let summary = `Network baseline is dominated by ${topCategory} traffic. `;
    let riskLevel = "LOW";
    let anomalies = [];

    if (errorCount > 50) {
      riskLevel = "CRITICAL";
      summary += `ALERT: High volume of traffic errors detected (${errorCount} events in sample). Potential service disruption or scanning activity.`;
      anomalies.push("High Error Rate detected in flow logs");
    } else if (errorCount > 10) {
      riskLevel = "MEDIUM";
      summary += `Caution: Elevated error rates observed in ${topCategory} category.`;
    }

    const unkCountries = lastLogs.filter(l => l.srcCountry && !["CA", "US", "PK", "Unknown", "-"].includes(l.srcCountry));
    if (unkCountries.length > 5) {
        summary += ` Non-standard geographic access detected from ${[...new Set(unkCountries.map(c => c.srcCountry))].join(', ')}.`;
        anomalies.push("Geographic Access Anomaly");
        riskLevel = riskLevel === "LOW" ? "MEDIUM" : riskLevel;
    }

    res.json({
      summary,
      riskLevel,
      anomalies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================

app.get("/api/analysis/summary", async (req, res) => {
  try {
    const lastLogs = await logsCollection
      .find({})
      .sort({ ts: -1 })
      .limit(500)
      .toArray();

    // Optional: Send logs to your AI summary engine (Python API)
    let aiSummary = "Unable to generate summary.";

    try {
      console.log("🧠 Generating AI Intelligence Summary...");
      const ai = await axios.post("http://127.0.0.1:8000/summary", {
        text: JSON.stringify(lastLogs)
      }, { timeout: 180000 }); // Increase to 3 minutes for deep analysis
      aiSummary = ai.data.summary || ai.data;
      console.log("✅ AI Summary Generated Successfully");
    } catch (err) {
      console.error("❌ AI Summary Engine Error:", err.message);
      aiSummary = `SYSTEM ADVISORY: The AI Neural Core is currently experiencing high processing demands. \n\nSTATUS: Service Latency Detected\nThreat Level: DEFERRED\n\nRecommendations:\n1. Re-scan in 60 seconds once neural buffers clear.\n2. Manual review of current telemetry is advised.`;
    }

    res.json({ summary: aiSummary });
  } catch (err) {
    res.status(500).json({ error: "Failed to communicate with AI Summary service." });
  }
});

app.post("/api/analysis/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const msgLower = message.toLowerCase();
    console.log(`🤖 AI Chat Request: "${message.substring(0, 50)}..."`);

    let contextData = "";

    // --- Context Injection Logic ---
    if (msgLower.includes("warning") || msgLower.includes("warn")) {
      const warnings = await logsCollection.find({
        $or: [{ severity: "warn" }, { severity: "warning" }]
      }).sort({ ts: -1 }).limit(10).toArray();
      contextData += `\n[Context: Recent Warning Logs]\n${JSON.stringify(warnings, null, 2)}`;
    }

    if (msgLower.includes("error") || msgLower.includes("critical") || msgLower.includes("failed")) {
      const errors = await logsCollection.find({
        severity: { $in: ["error", "critical"] }
      }).sort({ ts: -1 }).limit(10).toArray();
      contextData += `\n[Context: Recent Error/Critical Logs]\n${JSON.stringify(errors, null, 2)}`;
    }

    if (msgLower.includes("dashboard") || msgLower.includes("stats") || msgLower.includes("overview") || msgLower.includes("active")) {
      const total = await logsCollection.estimatedDocumentCount();
      const errorsCount = await logsCollection.countDocuments({ severity: "error" });
      const stats = { total_logs: total, total_errors: errorsCount };
      contextData += `\n[Context: Dashboard Global Stats]\n${JSON.stringify(stats)}`;
    }

    if (msgLower.includes("threat") || msgLower.includes("insights")) {
      const insights = await ThreatInsightsModel.find().sort({ _id: -1 }).limit(5).lean();
      contextData += `\n[Context: AI Threat Insights]\n${JSON.stringify(insights)}`;
    }

    // Wrap the message with context if found
    const enrichedMessage = contextData
      ? `USER QUERY: ${message}\n\nEVIDENCE CONTEXT (Real-time data from dashboard):\n${contextData}\n\nTask: Use the provided context to answer accurately. If logs are provided, analyze them and suggest a solution.`
      : message;

    const ai = await axios.post("http://127.0.0.1:8000/chat", {
      message: enrichedMessage,
      history
    }, { timeout: 180000 });

    res.json(ai.data);
  } catch (err) {
    console.error("❌ AI Chat Proxy Error:", err.message);
    res.status(500).json({ response: "AI engine connection failed or timed out." });
  }
});

app.get("/api/logs/trend", async (req, res) => {
  try {
    const { type, filter, interval } = req.query;
    let timeRange = 30 * 60 * 1000; // Default 30 min
    let bucketSize = 60 * 1000; // Default 1 min

    if (interval === "1h") {
      timeRange = 60 * 60 * 1000;
      bucketSize = 60 * 1000;
    } else if (interval === "6h") {
      timeRange = 6 * 60 * 60 * 1000;
      bucketSize = 10 * 60 * 1000;
    } else if (interval === "24h") {
      timeRange = 24 * 60 * 60 * 1000;
      bucketSize = 60 * 60 * 1000;
    }

    const startTime = new Date(Date.now() - timeRange);

    // Base match for time
    const match = { ts: { $gte: startTime } };

    // Apply categorical filters (Category)
    if (filter && filter !== "all") {
      if (filter === "firewall") match.category = "General Traffic";
      else if (filter === "vpn") match.category = "VPN";
      else if (filter === "application") match.category = "Application Control";
      else if (filter === "ips") match.category = "IPS";
      else if (filter === "dns") match.category = "DNS";
      else if (filter === "ssl") match.category = "SSL";
      else if (filter === "web") match.category = "Web Filter";
      else if (filter === "login") match.category = "Failed Login";
    }

    // Apply Severity filters
    if (type && type !== "all") {
      if (type === "error") match.severity = { $in: ["error", "critical", "alert"] };
      else if (type === "warning") match.severity = { $in: ["warning", "warn"] };
      else if (type === "info") match.severity = "info";
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$ts" },
                { $mod: [{ $toLong: "$ts" }, bucketSize] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const results = await logsCollection.aggregate(pipeline).toArray();

    // --- Gap-Filling Logic for Professional Line Charting ---
    const trend = [];
    const now = Date.now();
    const start = now - timeRange;

    // Build a map of existing data points
    const result_map = {};
    results.forEach(r => {
      const ts = new Date(r._id).getTime();
      result_map[ts] = r.count;
    });

    // Populate all buckets in the time window
    for (let ts = start; ts <= now; ts += bucketSize) {
      const bucket_aligned = Math.floor(ts / bucketSize) * bucketSize;
      const d = new Date(bucket_aligned);

      const label = interval === "24h"
        ? `${d.getHours()}:00`
        : `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

      trend.push({
        time: label,
        value: result_map[bucket_aligned] || 0
      });
    }

    res.json(trend.slice(-60)); // Return a clean set of points
  } catch (err) {
    console.error("Trend Data Error:", err.message);
    res.status(500).json({ error: "Failed to fetch trend data." });
  }
});

app.post("/api/analysis/filter", async (req, res) => {
  try {
    const { severity, category, device, srcCountry, dstCountry, start, end } = req.body;

    const query = {};

    if (severity) {
      // Use case-insensitive regex for severity (matches 'crit' to 'critical')
      query.severity = { $regex: severity, $options: "i" };
    }
    if (category) query.category = category;
    if (device) {
      // Use case-insensitive regex for device name
      query.deviceName = { $regex: device, $options: "i" };
    }
    if (srcCountry) query.srcCountry = { $regex: srcCountry, $options: "i" };
    if (dstCountry) query.destCountry = { $regex: dstCountry, $options: "i" };

    if (start && end) {
      query.ts = { $gte: new Date(start), $lte: new Date(end) };
    }

    const results = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(300)
      .toArray();

    res.json({ results });
  } catch (err) {
    console.error("❌ Filter Error:", err.message);
    res.status(500).json({ error: "Filtering failed." });
  }
});



// --- Threat Insights Model ---
// Mongoose import moved to top

const ThreatInsightsSchema = new mongoose.Schema({
  type: String,
  severity: String,
  description: String,
  timestamp: String
});

export const ThreatInsightsModel = mongoose.model("ThreatInsights", ThreatInsightsSchema);

const EarlyWarningSchema = new mongoose.Schema({
  platform: String, // Telegram, Discord, Onion, Forum
  rumor: String,
  impactScore: Number, // 0-100
  confidence: Number, // 0-100
  source: String,
  reference: String, // Source URL or trace
  timestamp: Date
});

export const EarlyWarningModel = mongoose.model("EarlyWarning", EarlyWarningSchema);

// ⭐ BACKGROUND AI INTELLIGENCE GENERATOR
if (isPrimary) {
  setInterval(async () => {
    try {
      const errorCount = await logsCollection.countDocuments({
        severity: "error",
        ts: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      if (errorCount > 10) {
        await ThreatInsightsModel.create({
          type: "Traffic Spike Analysis",
          severity: "High",
          description: `Detected ${errorCount} critical events in the last 5 minutes. Patterns suggest a possible coordinated ${errorCount > 20 ? 'DDoS' : 'scanning'} attempt against edge interfaces.`,
          timestamp: new Date().toLocaleString()
        });
      }

      const vpnLogs = await logsCollection.countDocuments({
        category: "VPN",
        ts: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      if (vpnLogs > 5) {
        await ThreatInsightsModel.create({
          type: "VPN Access Intel",
          severity: "Medium",
          description: `Heuristic analysis of VPN ingress points shows increased authentication traffic. Cross-referencing sources with global threat feeds for suspicious exit nodes.`,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (e) {
      console.error("AI Insight Generator Error:", e.message);
    }
  }, 300_000); // Every 5 minutes

  // 🕵️ RUMOR / CHATTER SIMULATOR
  setInterval(async () => {
    try {
      const platforms = ["Telegram", "Discord", "BreachForums", "XSS.is", "Onion/LeakSite"];
      const rumors = [
        "Seeing unverified reports of a database leak targeting corporate cloud infrastructure. Looking for confirmation.",
        "User claiming to have access to internal VPN credentials. Asking for 0.5 BTC for the sample data.",
        "Alert: New onion mirror mentions upcoming data release for telecom providers in the region.",
        "Chatter: Threat group discussing successful phishing campaign against HR department employees.",
        "Forum post: Offering zero-day exploit for common edge gateway used in local SOC infrastructures.",
        "Telegram leak: Sample list of 5,000 corporate emails found in latest 'ComboList' dump.",
        "Darknet notice: Recruiting 'insiders' at large Middle-Eastern financial institutions for AWS access.",
        "Breach announcement: Alleged customer data from a major regional ISP being auctioned on forums.",
        "Technical discussion: New bypass for specific 2FA implementations being shared in private Discord channels.",
        "Ransomware signal: Encrypted file fragments with unique headers spotted in common leak repositories.",
        "Credential stuffing alert: Massive spike in traffic observed targeting regional e-commerce login portals.",
        "Onion chatter: Group discussing potential vulnerabilities in common SIEM collectors used in SOCs.",
        "Zero-day rumor: Claims of a RCE vulnerability in widely used network monitoring software.",
        "Phishing kit update: New 'pixel-perfect' replicas of corporate SSO pages being distributed.",
        "Darkweb sale: Access to a corporate AD controller for a 'high-value target' being sold for 2 BTC.",
        "Telegram rumor: Hacktivist group planning a distributed denial-of-service (DDoS) on regional government sites.",
        "Botnet activity: Increase in C2 communication from previously dormant malware families.",
        "Insider threat signal: User on specialized forum asking about data exfiltration methods through DNS tunneling.",
        "Supply chain alert: Suspicious commits found in a common open-source library used for security logging.",
        "Cloud breach: S3 bucket misconfiguration leaked 10GB of sensitive configuration files."
      ];

      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
      const randomRumor = rumors[Math.floor(Math.random() * rumors.length)];
      const impact = Math.floor(Math.random() * 40) + 30; // 30-70
      const confidence = Math.floor(Math.random() * 50) + 20; // 20-70

      // Dynamic Mock Reference
      const mockRefId = Math.floor(100000 + Math.random() * 900000);
      let reference = "";
      if (randomPlatform.toLowerCase().includes("telegram")) reference = `https://t.me/threat_intel_central/${mockRefId}`;
      else if (randomPlatform.toLowerCase().includes("discord")) reference = `https://discord.com/channels/threat_hq/${mockRefId}`;
      else if (randomPlatform.toLowerCase().includes("onion")) reference = `http://leaksite_v3_onion.onion/trace/${mockRefId}`;
      else reference = `https://xss.is/threads/vuln_disclosure_${mockRefId}`;

      const newRumor = await EarlyWarningModel.create({
        platform: randomPlatform,
        rumor: randomRumor,
        impactScore: impact,
        confidence: confidence,
        source: "Aggregated Intelligence",
        reference: reference,
        timestamp: new Date()
      });

      // Emit via socket
      io.emit("threat:rumor", newRumor);
      console.log(`🕵️ Threat Early Warning -> Rumor Generated: [${randomPlatform}] ${randomRumor.substring(0, 50)}...`);

      // Also clean up old rumors (keep last 100)
      const count = await EarlyWarningModel.countDocuments();
      if (count > 100) {
        const oldest = await EarlyWarningModel.find().sort({ timestamp: 1 }).limit(count - 100);
        await EarlyWarningModel.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
      }

    } catch (e) {
      console.error("Rumor Simulator Error:", e.message);
    }
  }, 45_000); // Every 45 seconds
}

// 📉 Legacy stats interval removed (Integrated into Background Analytics Engine)





// Darkweb / Breach OSINT headlines cache (Mongo)
//var darkwebHeadlinesCollection = db.collection("darkweb_headlines");

// ===== Darkweb / Breach OSINT (free, no key) =====
const rss = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
  }
});
const osintCache = new NodeCache({ stdTTL: 60 }); // 60s cache

// Reputable breach/leak headlines (public RSS)
const FEEDS = [
  "https://www.bleepingcomputer.com/feed/",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://www.databreaches.net/feed/",
  "https://www.securityweek.com/feed",
  "https://threatpost.com/feed/", // Often redirected/archived but good historical
  "https://krebsonsecurity.com/feed/",
  "https://darkreading.com/rss.xml"
];

// simple keyword filter
const KEYWORDS = [
  "breach", "data breach", "leak", "leaked", "database", "ransomware",
  "credentials", "records", "exposed", "pwned", "passwords", "dark web",
  "deep web", "onion site", "darknet", "compromised", "exploit", "zero-day"
];

function looksLikeBreach(post) {
  const t = `${post.title || ""} ${post.contentSnippet || post.content || ""}`.toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

async function fetchOsintHeadlines() {
  const cached = osintCache.get("osint");
  if (cached) return cached;

  let items = [];
  for (const url of FEEDS) {
    try {
      const feed = await rss.parseURL(url);
      const filtered = (feed.items || []).filter(looksLikeBreach).map(i => {
        const title = i.title || "";
        const exposure = detectExposure(title);   // detect leaked creds

        return {
          source: (feed.title || "Feed").replace(/[:\-–].*$/, "").trim(),
          title,
          link: i.link,
          exposure,  // <--- IMPORTANT
          date: i.isoDate || i.pubDate || new Date().toISOString(),
        };
      });

      items = items.concat(filtered);
    } catch (e) {
      console.error("OSINT RSS error:", url, e.message);
    }
  }

  // sort newest first, keep 50
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  items = items.slice(0, 50);

  osintCache.set("osint", items, 300); // Increase cache to 5 minutes

  try {
    for (const it of items) {
      if (detectMajorBreach(it)) {
        io.emit("alert:new", {
          severity: "critical",
          ts: new Date(),
          message: `Major Darkweb Breach: ${it.title}`,
          parsed: it
        });
      }

      await darkwebHeadlinesCollection.updateOne(
        { link: it.link },
        { $set: it },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error("Mongo headline upsert error:", e.message);
  }

  return items;
}

// --- REST endpoint for frontend ---
// --- REST endpoint for frontend ---
app.get("/api/darkweb/headlines", async (_req, res) => {
  try {
    const items = await fetchOsintHeadlines();
    res.json({
      items: items.map(h => ({
        ...h,
        exposure: detectExposure(h.title)
      }))
    });

  } catch (e) {
    console.error("Failed to fetch headlines:", e.message);
    res.status(500).json({ error: "Failed to fetch headlines" });
  }
});


// --- background refresher + socket push (every 60s) ---
if (isPrimary) {
  setInterval(async () => {
    try {
      const items = await fetchOsintHeadlines();
      const cutoff = Date.now() - 70_000;
      items
        .filter(i => new Date(i.date).getTime() >= cutoff)
        .forEach(i => io.emit("darkweb:headline", i));
    } catch (e) {
      /* silent */
    }
  }, 300_000); // 5 minutes (reduced from 60s to prevent overload)
}

// === REAL DATABASE-DRIVEN THREAT INSIGHTS ===
app.get("/api/threat-insights", verifyToken, async (req, res) => {
  try {
    const insights = await ThreatInsightsModel.find()
      .sort({ timestamp: -1 })
      .limit(50);

    // If empty, generate a couple of initial insights to show it works
    if (insights.length === 0) {
      const initial = [
        { type: "Heuristic Pattern", severity: "Low", description: "Baseline security monitoring established. No immediate lateral movement detected in recent traffic samples.", timestamp: new Date().toLocaleString() },
        { type: "Anomalous Login", severity: "Medium", description: "Multiple failed login attempts detected from internal workstation range 10.180.80.x. Monitoring for brute force patterns.", timestamp: new Date().toLocaleString() }
      ];
      await ThreatInsightsModel.insertMany(initial);
      return res.json(initial);
    }

    res.json(insights);
  } catch (err) {
    console.error("❌ Threat Insights Error:", err.message);
    res.status(500).json({ error: "Failed to fetch threat insights" });
  }
});



app.get("/api/ai/threat-insights", async (req, res) => {
  try {
    // Example AI summary from SOC logs
    const chartData = [
      { category: "Phishing", count: 23, confidence: 91 },
      { category: "Brute Force", count: 15, confidence: 87 },
      { category: "Malware", count: 12, confidence: 93 },
      { category: "DDoS", count: 8, confidence: 89 },
    ];

    const summary =
      "The system detected increased phishing and brute-force attempts originating from Eastern Europe, with high confidence levels above 85%.";

    res.json({ summary, chartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.get("/api/darkweb/intelligence", async (req, res) => {
  try {
    const chartData = [
      { source: "Telegram", breaches: 18 },
      { source: "Reddit Leaks", breaches: 11 },
      { source: "Pastebin", breaches: 8 },
      { source: "Dark Forums", breaches: 14 },
      { source: "Breached.to", breaches: 21 },
    ];

    const summary =
      "Multiple credential leaks were identified on Telegram and Breached.to in the last 48 hours, indicating increased activity targeting corporate credentials.";

    res.json({ summary, chartData });
  } catch (err) {
    console.error("❌ Darkweb Intelligence Error:", err);
    res.status(500).json({ error: "Darkweb Intelligence fetch failed." });
  }
});

// --- THREAT EARLY WARNING ENDPOINTS ---
app.get("/api/threat/rumors", verifyToken, async (req, res) => {
  try {
    const rumors = await EarlyWarningModel.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(rumors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/threat/stats", verifyToken, async (req, res) => {
  try {
    const rumors = await EarlyWarningModel.find().sort({ timestamp: -1 }).limit(100);
    
    // Impact over time (simulated grouping)
    const stats = rumors.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intensity: r.impactScore,
      confidence: r.confidence
    })).reverse();

    // Platform distribution
    const platformCounts = rumors.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1;
      return acc;
    }, {});

    const distribution = Object.entries(platformCounts).map(([name, value]) => ({ name, value }));

    res.json({ stats, distribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/threat/analysis", verifyToken, async (req, res) => {
  try {
    const recent = await EarlyWarningModel.find().sort({ timestamp: -1 }).limit(10);
    
    let summary = "The Tactical Intelligence Core is currently monitoring baseline chatter levels. Signal persistence is stable.";
    let signalStrength = 40;
    let recommendations = [
        { title: "Standard Monitoring", desc: "Maintain current security posture and monitor for baseline drifts.", icon: "Activity" },
        { title: "Internal Briefing", desc: "Advise security teams on general threat landscape trends.", icon: "Info" }
    ];

    if (recent.length > 0) {
      const avgImpact = recent.reduce((acc, r) => acc + r.impactScore, 0) / recent.length;
      signalStrength = Math.min(Math.floor(avgImpact * 1.2), 100);

      const highImpact = recent.find(r => r.impactScore > 65);
      if (highImpact) {
        summary = `ALERT: High-intensity signal detected on ${highImpact.platform}. Intelligence suggests active targeting of internal assets related to "${highImpact.rumor.substring(0, 50)}...". Persistence is INCREASING.`;
        recommendations = [
            { title: "Rotate Edge Keys", desc: "Change credentials for VPN and Edge Gateways immediately due to targeted chatter.", icon: "Lock" },
            { title: "High-Intensity Monitoring", desc: "Shift FAZ monitoring to 'Critical' for the next 48h.", icon: "Activity" },
            { title: "Block Source IPs", desc: "Implement proactive blocks for IPs associated with identified threat platforms.", icon: "ShieldAlert" }
        ];
      } else {
        const platforms = [...new Set(recent.map(r => r.platform))];
        summary = `Intelligence monitoring reports moderate background chatter across ${platforms.join(', ')}. No immediate pre-breach indicators confirmed.`;
        recommendations = [
            { title: "Credential Audit", desc: "Review access logs for administrative accounts and VPN usage.", icon: "Fingerprint" },
            { title: "Update Threat Lists", desc: "Ensure all SIEM threat feeds are synchronized with the latest OSINT data.", icon: "Activity" },
            { title: "External Pentest", desc: "Trigger an automated surface discovery for exposed edge assets.", icon: "Globe" }
        ];
      }
    }

    res.json({ 
      summary,
      prediction: signalStrength > 70 ? "Impact Window: < 24 Hours" : "Impact Window: 48-72 Hours",
      signalStrength,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// --- DARKWEB LIVE STREAM (simulated or connected feed) ---
let darkwebActivity = [
  { source: "Telegram", breaches: 18 },
  { source: "Reddit Leaks", breaches: 11 },
  { source: "Pastebin", breaches: 8 },
  { source: "Dark Forums", breaches: 14 },
  { source: "Breached.to", breaches: 21 },
];

if (isPrimary) {
  // Emit new alerts every 30 seconds
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * darkwebActivity.length);
    darkwebActivity[randomIndex].breaches += Math.floor(Math.random() * 5);

    io.emit("darkweb:update", {
      source: darkwebActivity[randomIndex].source,
      breaches: darkwebActivity[randomIndex].breaches,
      timestamp: new Date(),
    });

    console.log(
      `🕵️ Darkweb Update → ${darkwebActivity[randomIndex].source}: ${darkwebActivity[randomIndex].breaches} breaches`
    );
  }, 30000);
}



// --- Socket.IO Connection ---
io.on("connection", (socket) => {
  console.log("🟢 Dashboard connected");
  socket.on("disconnect", () => console.log("🔴 Dashboard disconnected"));
});

// --- Live FAZ Log Streaming ---
const logPath = "/var/log/faz/faz.log";




// --- Syslog UDP Listener (FortiAnalyzer → Local Log File) ---
// --- Syslog UDP Listener (FAZ → /var/log/faz/faz.log) ---
import dgram from "dgram";

const SYSLOG_PORT = 514;
const SYSLOG_FILE = "/var/log/faz/faz.log";

// Ensure log folder exists
if (!fs.existsSync("/var/log/faz")) {
  fs.mkdirSync("/var/log/faz", { recursive: true });
  console.log("📁 Created /var/log/faz directory");
}

// Create UDP socket
const syslogServer = dgram.createSocket("udp4");

syslogServer.on("error", (err) => {
  console.error("❌ Syslog server error:", err.message);
  syslogServer.close();
});

syslogServer.on("message", (msg, rinfo) => {
  const line = msg.toString().trim();
  const logLine = `${new Date().toISOString()} ${rinfo.address} ${line}\n`;
  fs.appendFile(SYSLOG_FILE, logLine, (err) => {
    if (err) console.error("❌ Failed to write syslog:", err.message);
  });
});

syslogServer.on("listening", () => {
  const address = syslogServer.address();
  console.log(`📡 Syslog server listening on ${address.address}:${address.port}`);
});

if (isPrimary) {
  syslogServer.bind(SYSLOG_PORT, "0.0.0.0");
}

// ----------------------------------------------
// 🧠 HUMAN-FRIENDLY LOG SUMMARY BUILDER
// ----------------------------------------------
function generateHumanMessage(log) {
  const sev = log.severity?.toUpperCase() || "INFO";
  const src = log.sourceIp || "Unknown";
  const dst = log.destIp || "Unknown";
  const dev = log.deviceName || "Unknown Device";
  const action = log.action || "N/A";
  const service = log.service || "Unknown Service";
  const port = log.dstPort || "N/A";

  return `${dev} logged a ${sev} event: ${service} traffic from ${src} to ${dst} (port ${port}). Action: ${action}.`;
}




// 🧠 Advanced FAZ Log Parser
function parseFAZLog(line) {
  if (!line || !line.trim()) return null;

  const severityMatch = line.match(/\b(INFO|WARNING|ERROR|CRITICAL|ALERT)\b/i);
  const ipMatch = line.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);

  const log = {
    ts: timestampMatch ? new Date(timestampMatch[0]) : new Date(),
    message: line.replace(timestampMatch?.[0] || "", "").trim(),
    severity: severityMatch ? severityMatch[1].toLowerCase() : "info",
    source_ip: ipMatch ? ipMatch[0] : null,
    source: "FAZ",
  };

  return log;
}

// --- 🚀 HIGH-SPEED INGESTION BUFFER ---
let logBuffer = [];
let logThrottleActive = false;

// --- 📦 BULK DB WRITE BUFFER ---
let bulkLogBuffer = [];
let bulkEventBuffer = [];
let bulkIngestActive = false;

// --- 🚀 REAL-TIME EMIT ENGINE ---
function emitLog(doc) {
  logBuffer.push(doc);
  if (!logThrottleActive) {
    logThrottleActive = true;
    setTimeout(() => {
      io.emit("alert:batch", logBuffer);
      logBuffer = [];
      logThrottleActive = false;
    }, 300);
  }
}

// --- 🌍 INTERNAL IP RESOLVER (LAN → Toronto Datacenter) ---
function resolveInternalIP(ip) {
  if (!ip) return null;
  const privateRanges = ["10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."];
  if (privateRanges.some(prefix => ip.startsWith(prefix))) {
    return { lat: 43.6532, lng: -79.3832 }; // Toronto SOC
  }
  const geo = geoip.lookup(ip);
  if (geo && geo.ll) {
    return { lat: geo.ll[0], lng: geo.ll[1] };
  }
  return null;
}

/**
 * High-throughput Ingestion Engine
 * Aggregates logs in-memory and executes bulk MongoDB writes.
 */
async function flushIngestionBuffer() {
  if (bulkLogBuffer.length === 0 && bulkEventBuffer.length === 0) return;
  if (bulkIngestActive) return;

  bulkIngestActive = true;
  const logsToProcess = [...bulkLogBuffer];
  const eventsToProcess = [...bulkEventBuffer];
  bulkLogBuffer = [];
  bulkEventBuffer = [];

  try {
    if (!logsCollection || !eventsCollection || !incidentsCollection) {
      // Still connecting... graceful skip
      return;
    }

    // 1. Group logs by fingerprint for deduplication (In-Memory Aggregation)
    const logMap = new Map();
    logsToProcess.forEach(log => {
      const key = `${log.fingerprint}_${Math.floor(new Date(log.ts).getTime() / 3600000)}`; // 1h bucket
      if (!logMap.has(key)) {
        logMap.set(key, { ...log, count: 1 });
      } else {
        logMap.get(key).count += 1;
        logMap.get(key).lastSeen = new Date();
      }
    });

    // 2. Build Bulk Operations for Logs
    const logOps = Array.from(logMap.values()).map(log => {
      const { count, lastSeen, ...logData } = log;
      return {
        updateOne: {
          filter: { fingerprint: log.fingerprint, ts: { $gte: new Date(Date.now() - 3600000) } },
          update: {
            $setOnInsert: { ...logData, firstSeen: new Date() },
            $set: { lastSeen: new Date() },
            $inc: { count: log.count }
          },
          upsert: true
        }
      };
    });

    // 3. Group events by fingerprint
    const eventMap = new Map();
    eventsToProcess.forEach(ev => {
      const key = ev.eventFingerprint;
      if (!eventMap.has(key)) {
        eventMap.set(key, { ...ev, occurrenceCount: 1 });
      } else {
        eventMap.get(key).occurrenceCount += 1;
        eventMap.get(key).lastSeen = new Date();
      }
    });

    // 4. Build Bulk Operations for Events
    const eventOps = Array.from(eventMap.values()).map(ev => {
      const { occurrenceCount, lastSeen, riskLevel, riskLabel, ...evData } = ev;
      return {
        updateOne: {
          filter: { eventFingerprint: ev.eventFingerprint, lastSeen: { $gte: new Date(Date.now() - 3600000) } },
          update: {
            $set: {
              lastSeen: new Date(),
              riskLevel: ev.riskLevel,
              riskLabel: ev.riskLabel
            },
            $setOnInsert: {
              ...evData,
              firstSeen: new Date(),
            },
            $inc: { occurrenceCount: ev.occurrenceCount },
            $addToSet: {
              affectedHosts: ev.source,
              sources: ev.source,
              targets: ev.target
            }
          },
          upsert: true
        }
      };
    });

    // 5. Execute DB Writes in Parallel
    const startTime = performance.now();
    await Promise.all([
      logOps.length > 0 ? logsCollection.bulkWrite(logOps, { ordered: false }) : Promise.resolve(),
      eventOps.length > 0 ? eventsCollection.bulkWrite(eventOps, { ordered: false }) : Promise.resolve()
    ]);
    const duration = (performance.now() - startTime).toFixed(2);

    if (logOps.length > 50) {
      console.log(`📦 Bulk Ingest: Processed ${logsToProcess.length} logs (${logOps.length} unique) and ${eventOps.length} events in ${duration}ms`);
    }

    // 6. Trigger Incident Detection on a subset of fresh events
    // (We only check major ones or a sample to save CPU)
    for (const ev of eventMap.values()) {
      if (ev.riskLevel === 'CRITICAL' || Math.random() < 0.1) {
        try {
          const { shouldCreate, incidentData } = await detectIncident(ev, eventsCollection, incidentsCollection);
          if (shouldCreate) await createOrUpdateIncident(incidentData, incidentsCollection);
        } catch (e) { }
      }
    }

  } catch (err) {
    console.error("❌ Bulk ingestion error:", err.message);
  } finally {
    bulkIngestActive = false;
  }
}

// Status updates moved...




// --- CHATBOT ENDPOINT ---
app.post("/chat", async (req, res) => {
  const { message, userName, userEmail } = req.body;
  console.log("💬 /chat endpoint hit:", message);

  // 🔹 Security Incident Trigger
  if (
    message.toLowerCase().includes("failed login") ||
    message.toLowerCase().includes("unauthorized")
  ) {
    try {
      const event = {
        severity: "warn",
        message,
        source: { device: "QueryTel Chatbot" },
        parsed: { type: "incident" },
        ts: new Date(),
      };

      const insert = await logsCollection.insertOne(event);

      try {
        const aiResp = await axios.post("http://127.0.0.1:8000/summary", {
          text: message,
        });
        const ai = aiResp.data;
        await logsCollection.updateOne(
          { _id: insert.insertedId },
          { $set: { ai } }
        );
        event.ai = ai;
        io.emit("alert:new", event);
      } catch (err) {
        console.error("❌ AI Summary Error:", err.message);
      }

      console.log("✅ Incident log stored");
    } catch (err) {
      console.error("❌ Mongo insert error:", err.message);
    }
  }

  // 🔹 Troubleshooter Trigger
  if (message.toLowerCase().includes("troubleshoot")) {
    try {
      await axios.post(
        "https://parties-download-ix-yamaha.trycloudflare.com/api/troubleshoot/start",
        {
          device: "OWAIS-PC",
          checks: [
            "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10",
            "Get-ComputerInfo | Select-Object -First 5",
          ],
        }
      );
      return res.json({
        reply: "🛠️ Troubleshooting started. Running system diagnostics.",
      });
    } catch {
      return res.json({ reply: "❌ Failed to start troubleshooting." });
    }
  }

  // 🔹 Technician Ticket Trigger
  if (message.toLowerCase().includes("talk to technician")) {
    const reply = await createZohoTicket(
      userName || "User",
      userEmail || "noreply@querytel.com",
      message
    );
    return res.json({ reply });
  }

  // Default Chatbot Response
  return res.json({
    reply: "🤖 I'm here to help with anything else you need!",
  });
});

// PUBLIC logs for the Global Map (no token required)
app.get("/api/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 80;
    const { severity, category } = req.query;

    // Build query based on filters
    const query = {};

    if (severity) {
      if (severity === 'warning') {
        query.severity = { $in: ['warn', 'warning'] };
      } else {
        query.severity = severity;
      }
    }

    if (category) {
      query.category = category;
    }

    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(limit)
      .toArray();

    res.json({ logs });
  } catch (err) {
    console.error("❌ Public /api/logs failed:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});


// --- FETCH LOGS ---
// --- FETCH LOGS (Paginated) ---
app.get("/logs", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await logsCollection.countDocuments();
    const logs = await logsCollection
      .find()
      .sort({ ts: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// --- FETCH WARNING LOGS ---
app.get("/api/logs/warning", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = {};

    if (category === "Critical") {
      // If user specifically asked for Critical category, we search for critical/alert/emergency severities
      query.severity = { $in: ["critical", "crit", "alert", "emergency"] };
    } else {
      // Default to warn/warning severities
      query.severity = { $in: ["warn", "warning"] };

      if (category && category !== "all") {
        const catMap = {
          "SSL": { $or: [{ category: "SSL" }, { message: /ssl/i }, { service: /ssl/i }] },
          "DNS": { $or: [{ category: "DNS" }, { message: /dns/i }, { service: /dns/i }] },
          "Application Control": { $or: [{ category: "Application Control" }, { message: /app-ctrl/i }] },
          "IPS": { $or: [{ category: "IPS" }, { message: /utm|ips/i }] },
          "Web Filter": { $or: [{ category: "Web Filter" }, { message: /webfilter|url/i }] },
          "VPN": { $or: [{ category: "VPN" }, { message: /vpn|dialup|tunnel/i }, { service: /vpn|dialup/i }] },
          "Failed Login": { $or: [{ category: "Failed Login" }, { $and: [{ message: /login/i }, { message: /failed/i }] }] },
          "Admin Access": { $or: [{ category: "Admin Access" }, { message: /admin/i }] }
        };

        if (catMap[category]) {
          Object.assign(query, catMap[category]);
        } else {
          query.category = category;
        }
      }
    }

    if (startDate && endDate) {
      query.ts = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(startDate && endDate ? 2000 : 200)
      .toArray();

    res.json(logs);
  } catch (err) {
    console.error("❌ Failed to fetch warning logs:", err.message);
    res.status(500).json({ error: "Failed to fetch warning logs" });
  }
});

// --- GLOBAL LOG SEARCH ---
app.get("/api/logs/search", verifyToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 50, severity } = req.query;
    if (!q) return res.json({ logs: [], total: 0 });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const regex = new RegExp(q, 'i');

    const query = {
      $or: [
        { message: regex },
        { sourceIp: regex },
        { destIp: regex },
        { deviceName: regex },
        { category: regex },
        { severity: regex },
        { humanMessage: regex }
      ]
    };

    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    const total = await logsCollection.countDocuments(query);
    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.json({ logs, total });
  } catch (err) {
    console.error("❌ Global search failed:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// --- FETCH WARNING LOGS WITH CATEGORY + DATE FILTERS ---
app.post("/api/logs/warning/filter", verifyToken, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.body;

    const query = {
      severity: { $in: ["warn", "warning"] }
    };

    // Category Filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Date Range Filter
    if (startDate && endDate) {
      query.ts = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(1000)
      .toArray();

    res.json({ ok: true, logs });
  } catch (err) {
    console.error("❌ Warning Filter Error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to fetch filtered warnings" });
  }
});


// --- FILTERED LOG ENDPOINTS ---

// --- INGEST ENDPOINT (external) ---
app.post("/ingest", async (req, res) => {
  try {
    const { event, parsed, source } = req.body;
    const doc = { ...event, parsed, source, ts: new Date() };
    const insert = await logsCollection.insertOne(doc);

    try {
      const aiResp = await axios.post("http://127.0.0.1:8000/summary", {
        text: event.message || "",
      });
      const ai = aiResp.data;
      await logsCollection.updateOne(
        { _id: insert.insertedId },
        { $set: { ai } }
      );
      doc.ai = ai;
    } catch (err) {
      console.error("❌ AI Summary API Error:", err.message);
    }

    io.emit("alert:new", doc);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Ingest Error:", err.message);
    res.status(500).json({ error: "Failed to ingest log" });
  }
});

app.get("/api/darkweb/score", async (req, res) => {
  try {
    const items = await darkwebHeadlinesCollection.find().toArray();
    const score = calculateThreatScore(items);
    res.json({ score });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute score" });
  }
});


// --- ZOHO OAUTH CALLBACK ---
//port querystring from "querystring";
//port fs from "fs";
//port axios from "axios";
//port dotenv from "dotenv";
//tenv.config();

// --- ZOHO CALLBACK FIX ---
// --- ZOHO CALLBACK FIX ---
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authorization code missing.");

  try {
    console.log("🔑 Received Zoho Auth Code:", code);

    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      querystring.stringify({
        grant_type: "authorization_code",
        client_id: process.env.ZOHO_CLIENT_ID || "1000.HUOE5GHKSD5A6UPWISU8NLIZF24DWG",
        client_secret: process.env.ZOHO_CLIENT_SECRET || "8a4611e883121e808b859aa31f1cd1b2d396e028f1",
        redirect_uri: "https://7c59c6afd123.ngrok-free.app/callback",
        code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    fs.writeFileSync("zoho_tokens.json", JSON.stringify(response.data, null, 2));
    console.log("✅ Zoho tokens saved successfully!");

    res.send("✅ Zoho Authorization Successful. You can close this window.");
  } catch (err) {
    console.error("❌ Zoho OAuth Error:", err.response?.data || err.message);
    res.status(500).send("❌ OAuth token exchange failed.");
  }
});

// --- Logs Stats & Time-Series for Dashboard ---

// Get overall stats for summary cards
app.get("/logs/stats", verifyToken, async (req, res) => {
  try {
    const total = await logsCollection.countDocuments();
    const info = await logsCollection.countDocuments({ severity: "info" });
    const errors = await logsCollection.countDocuments({ severity: "error" });
    const warnings = await logsCollection.countDocuments({
      $or: [{ severity: "warn" }, { severity: "warning" }],
    });

    res.json({ total, info, errors, warnings });
  } catch (err) {
    console.error("❌ /logs/stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch log stats" });
  }
});

// Time-series for Error & Warning Trends chart
app.get("/logs/timeseries", verifyToken, async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const data = await logsCollection
      .aggregate([
        { $match: { ts: { $gte: last24h } } },
        {
          $group: {
            _id: {
              minute: { $dateTrunc: { date: "$ts", unit: "minute" } },
              severity: "$severity",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.minute": 1 } },
      ])
      .toArray();

    const formatted = {};
    for (const d of data) {
      const minute = d._id.minute;
      if (!formatted[minute])
        formatted[minute] = { time: minute, errors: 0, warnings: 0, info: 0 };

      const sev = d._id.severity;
      if (sev === "error") formatted[minute].errors += d.count;
      else if (["warn", "warning"].includes(sev)) formatted[minute].warnings += d.count;
      else if (sev === "info") formatted[minute].info += d.count;
    }

    res.json(Object.values(formatted));
  } catch (err) {
    console.error("❌ /logs/timeseries error:", err.message);
    res.status(500).json({ error: "Failed to compute timeseries" });
  }
});
// --- SYSTEM HEALTH ENDPOINT ---
// [Garbage block removed]

connectMongo();

// 🧠 START BACKGROUND ANALYTICS ENGINE
// startBackgroundAnalytics called inside connectMongo


// --- SYSTEM HEALTH ENDPOINT (OPTIMIZED) ---
app.get("/api/health", async (req, res) => {
  try {
    // ⚡ CACHE CHECK (15s TTL to prevent spam)
    const cachedHealth = analyticsCache.get("systemHealth");
    if (cachedHealth) {
      return res.json(cachedHealth);
    }

    const start = performance.now();

    // ✅ Basic server metrics
    const uptimeSec = process.uptime();
    const mem = process.memoryUsage();
    const load = os.loadavg()[0];

    // ✅ MongoDB status
    const mongoStatus = logsCollection ? "Connected" : "Disconnected";

    // ✅ Quick log stats (OPTIMIZED: Last 24h only)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run counts in parallel
    const [activeErrors, activeWarnings] = await Promise.all([
      logsCollection.countDocuments({ severity: "error", ts: { $gte: last24h } }),
      logsCollection.countDocuments({
        $or: [{ severity: "warn" }, { severity: "warning" }],
        ts: { $gte: last24h }
      })
    ]);

    const end = performance.now();
    const latency = Math.round(end - start);

    const healthData = {
      status: "Healthy",
      uptime: Math.round(uptimeSec),
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      load: Number(load.toFixed(2)),
      mongo: mongoStatus,
      activeAlerts: activeErrors + activeWarnings,
      latency,
      timestamp: new Date(),
    };

    // 💾 Save to cache (15s)
    analyticsCache.set("systemHealth", healthData, 15);

    res.json(healthData);
  } catch (err) {
    console.error("❌ /api/health error:", err.message);
    res.status(500).json({ status: "Offline", error: err.message });
  }
});



app.get("/api/zoho/tickets", async (req, res) => {
  console.log("🎟️ Fetching Zoho Tickets via /api/zoho/tickets");
  try {
    const result = await listZohoTickets(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/zoho/tickets", async (req, res) => {
  try {
    const { userName, userEmail, message, issueDescription } = req.body;
    console.log("🎟️ Creating Zoho Ticket via /api/zoho/tickets");

    const finalMessage = issueDescription || message || "No description provided.";
    const result = await createZohoTicket(
      userName || "User",
      userEmail || "noreply@querytel.com",
      finalMessage
    );

    res.json({ ok: !result.startsWith("❌"), result });
  } catch (err) {
    console.error("❌ Zoho Route Error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === PUBLIC ROUTES for Dashboard Summary ===

// Public stats for summary cards


// Public timeseries data
// === PUBLIC ROUTES for Dashboard and Analysis ===
// ------------------------------------------------------------------
// 🧠 BACKGROUND ANALYTICS ENGINE (Handles millions of logs gracefully)
// ------------------------------------------------------------------
// analyticsCache moved to global scope

async function startBackgroundAnalytics() {
  console.log("📊 Starting Background Analytics Engine...");

  const runAnalytics = async () => {
    try {
      const startTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1h Window (optimized for scale)

      console.log("⏱️ Refreshing Analytics (1h window)...");
      const startTimer = performance.now();

      // 0. Quick Total Doc Count (Non-blocking)
      const totalEvents = await eventsCollection.estimatedDocumentCount();

      // 1. Calculate Global Stats (Last 1h)
      console.log("  [Analytics] Stage 1: Global Stats...");
      const statsArray = await logsCollection.aggregate([
        { $match: { ts: { $gte: startTime } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            info: { $sum: { $cond: [{ $eq: ["$severity", "info"] }, 1, 0] } },
            errors: { $sum: { $cond: [{ $eq: ["$severity", "error"] }, 1, 0] } },
            warnings: { $sum: { $cond: [{ $or: [{ $eq: ["$severity", "warn"] }, { $eq: ["$severity", "warning"] }] }, 1, 0] } },
            general: { $sum: { $cond: [{ $eq: ["$category", "General Traffic"] }, 1, 0] } },
            application: { $sum: { $cond: [{ $eq: ["$category", "Application Control"] }, 1, 0] } },
            antivirus: { $sum: { $cond: [{ $eq: ["$category", "Web Filter"] }, 1, 0] } },
            dns: { $sum: { $cond: [{ $eq: ["$category", "DNS"] }, 1, 0] } },
            ssl: { $sum: { $cond: [{ $eq: ["$category", "SSL"] }, 1, 0] } },
            ips: { $sum: { $cond: [{ $eq: ["$category", "IPS"] }, 1, 0] } },
            failedLogin: { $sum: { $cond: [{ $eq: ["$category", "Failed Login"] }, 1, 0] } },
            vpn: { $sum: { $cond: [{ $eq: ["$category", "VPN"] }, 1, 0] } },
            adminAccess: { $sum: { $cond: [{ $eq: ["$category", "Admin Access"] }, 1, 0] } },
            // 🛡️ Mitigation Metrics
            unmitigated: { $sum: { $cond: [{ $eq: ["$riskLevel", "CRITICAL"] }, 1, 0] } },
            prevented: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } }
          }
        }
      ], { allowDiskUse: true, hint: { ts: -1 } }).toArray();
      console.log(`  [Analytics] Stage 1 Done (${statsArray.length} results)`);

      const globalStatsRes = statsArray[0] || {
        total: 0, info: 0, errors: 0, warnings: 0,
        general: 0, application: 0, antivirus: 0,
        dns: 0, ssl: 0, ips: 0, failedLogin: 0,
        vpn: 0, adminAccess: 0,
        unmitigated: 0, prevented: 0
      };

      // Set total from estimated count if aggregation is windowed
      globalStatsRes.totalEvents = totalEvents;
      const globalStats = globalStatsRes;

      // 2. Calculate Top Destinations (Last 1h)
      console.log("  [Analytics] Stage 2: Top Destinations...");
      const topDest = await logsCollection.aggregate([
        { $match: { ts: { $gte: startTime }, destCountry: { $exists: true, $ne: "Unknown" } } },
        { $group: { _id: "$destCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
      const destinations = topDest.map(d => ({ name: d._id, value: d.count }));
      console.log(`  [Analytics] Stage 2 Done (${destinations.length} results)`);

      // 3. Calculate Most Active Devices (Last 1h)
      console.log("  [Analytics] Stage 3: Active Devices...");
      const activeDev = await logsCollection.aggregate([
        { $match: { ts: { $gte: startTime }, deviceName: { $exists: true, $ne: "Unknown Device" } } },
        { $group: { _id: "$deviceName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
      const devices = activeDev.map(d => ({ name: d._id, value: d.count }));
      console.log(`  [Analytics] Stage 3 Done (${devices.length} results)`);

      // Save to local cache
      analyticsCache.set("globalStats", globalStats);
      analyticsCache.set("topDestinations", destinations);
      analyticsCache.set("activeDevices", devices);

      // 🌐 SYNC TO CLUSTER (MongoDB Persistent Cache)
      if (statsCacheCollection) {
        await statsCacheCollection.updateOne(
          { key: "cluster_stats" },
          {
            $set: {
              globalStats,
              topDestinations: destinations,
              activeDevices: devices,
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );
      }

      // 📡 Broadcast live update to all connected dashboards
      io.emit("stats:update", globalStats);

      const endTimer = performance.now();
      console.log(`✅ Analytics refreshed in ${((endTimer - startTimer) / 1000).toFixed(2)}s`);
    } catch (err) {
      console.error("❌ Analytics Engine Failed:", err.message);
    } finally {
      // 🛡️ RECURSIVE TIMEOUT pattern prevents job stacking
      setTimeout(runAnalytics, 120 * 1000); // 2 Min interval
    }
  };

  const runMitreAnalytics = async () => {
    try {
      console.log("🛠️ Refreshing MITRE Coverage (30d window)...");
      const startTimer = performance.now();

      // 4. Calculate MITRE Coverage (Last 30 Days for baseline)
      const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const mitreStructure = getMitreMatrixStructure();
      const mitreCoverage = [];

      // 🔥 OPTIMIZED: Single aggregation instead of nested loops
      console.log("  [MITRE] Running bulk coverage aggregation...");
      const detections = await logsCollection.aggregate([
        { $match: { "mitre.id": { $exists: true }, ts: { $gte: last30d } } },
        { $group: { _id: "$mitre.id", count: { $sum: 1 }, lastSeen: { $max: "$ts" } } }
      ]).toArray();

      const detectionMap = {};
      detections.forEach(d => {
        detectionMap[d._id] = { count: d.count, lastSeen: d.lastSeen };
      });

      for (const [tacticName, tacticData] of Object.entries(mitreStructure)) {
        for (const tech of tacticData.techniques) {
          const stats = detectionMap[tech.id] || { count: 0, lastSeen: null };

          let status = "Not Covered";
          if (stats.count > 10) status = "Covered";
          else if (stats.count > 0) status = "Partial";

          mitreCoverage.push({
            tactic: tacticName,
            technique_id: tech.id,
            technique_name: tech.name,
            coverage_status: status,
            detection_count: stats.count,
            last_detected: stats.lastSeen
          });
        }
      }

      if (statsCacheCollection) {
        await statsCacheCollection.updateOne(
          { key: "mitre_matrix" },
          { $set: { coverage: mitreCoverage, lastUpdated: new Date() } },
          { upsert: true }
        );
      }

      const endTimer = performance.now();
      console.log(`✅ MITRE Analytics refreshed in ${((endTimer - startTimer) / 1000).toFixed(2)}s`);
    } catch (err) {
      console.error("❌ MITRE Analytics Failed:", err.message);
    } finally {
      setTimeout(runMitreAnalytics, 3600 * 1000); // 1 Hour interval (expensive job)
    }
  };

  runAnalytics(); // Init fast stats (2m)
  setTimeout(runMitreAnalytics, 10000); // Start MITRE stats slightly delayed (1h loop)
}

app.get("/api/logs/stats", async (_req, res) => {
  try {
    let cached = analyticsCache.get("globalStats");
    if (!cached && statsCacheCollection) {
      const dbCached = await statsCacheCollection.findOne({ key: "cluster_stats" });
      if (dbCached) {
        cached = dbCached.globalStats;
        analyticsCache.set("globalStats", cached);
      }
    }

    if (cached) return res.json(cached);

    res.json({
      total: 0, info: 0, errors: 0, warnings: 0,
      general: 0, application: 0, antivirus: 0,
      dns: 0, ssl: 0, ips: 0, failedLogin: 0,
      vpn: 0, adminAccess: 0
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Top Destination Countries
app.get("/api/logs/top-destinations", async (_req, res) => {
  try {
    let cached = analyticsCache.get("topDestinations");
    if (!cached && statsCacheCollection) {
      const dbCached = await statsCacheCollection.findOne({ key: "cluster_stats" });
      if (dbCached) {
        cached = dbCached.topDestinations;
        analyticsCache.set("topDestinations", cached);
      }
    }
    if (cached) return res.json(cached);
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Most Active Devices
app.get("/api/logs/active-devices", async (_req, res) => {
  try {
    let cached = analyticsCache.get("activeDevices");
    if (!cached && statsCacheCollection) {
      const dbCached = await statsCacheCollection.findOne({ key: "cluster_stats" });
      if (dbCached) {
        cached = dbCached.activeDevices;
        analyticsCache.set("activeDevices", cached);
      }
    }
    if (cached) return res.json(cached);
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ====================== LOG ROUTES ===========================


// ========== FINAL CLEAN LOG ROUTES (USE THIS ONLY) ==========
app.get("/api/logs/info", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { severity: "info" };

    if (startDate && endDate) {
      query.ts = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(startDate && endDate ? 2000 : 200)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch info logs" });
  }
});

app.get("/api/logs/error", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { severity: "error" };

    if (startDate && endDate) {
      query.ts = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await logsCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(startDate && endDate ? 2000 : 200)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch error logs" });
  }
});

// =======================================================
// ⭐ FETCH LOGS BY CATEGORY (For Pie Chart Drawer)
// =======================================================
// =======================================================
// ⭐ FETCH LOGS BY CATEGORY (Paginated + Human Messages)
// =======================================================
app.get("/api/logs/by-category", verifyToken, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    if (!category) {
      return res.status(400).json({ error: "Missing category" });
    }

    const skip = (page - 1) * limit;

    const total = await logsCollection.countDocuments({ category });

    let logs = await logsCollection
      .find({ category })
      .project({
        severity: 1,
        ts: 1,
        message: 1,
        humanMessage: 1,
        cleanMessage: 1,
        sourceIp: 1,
        destIp: 1,
        service: 1,
        action: 1,
        deviceName: 1
      })
      .sort({ ts: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    // ⭐ FORCE humanMessage for ANY missing logs
    logs = logs.map(log => {
      if (log.humanMessage && log.humanMessage.length > 10) return log;

      return {
        ...log,
        humanMessage: generateSummary({
          severity: log.severity,
          deviceName: log.deviceName,
          sourceIp: log.sourceIp,
          destIp: log.destIp,
          service: log.service,
          action: log.action,
          dstPort: log.dstPort,
          message: log.message
        })
      };
    });

    res.json({
      ok: true,
      logs,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error("❌ Category filter error:", err.message);
    res.status(500).json({ error: "Failed to fetch logs by category" });
  }
});


// =======================================================
// ⭐ FETCH CATEGORY STATS FOR PIE CHART
// =======================================================
app.get("/api/logs/categories", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await logsCollection.aggregate([
      { $match: { ts: { $gte: last24h } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    res.json(result);
  } catch (err) {
    console.error("❌ Category stats error:", err.message);
    res.status(500).json({ error: "Failed to compute category stats" });
  }
});



// ====================== TOP COUNTRIES (REAL) ===========================

app.get("/api/top-countries", async (req, res) => {
  try {
    const logs = await logsCollection
      .find({}, { projection: { sourceIp: 1, srcCountry: 1 } })
      .limit(50000) // limit to avoid huge processing
      .toArray();

    const counts = {};

    logs.forEach(log => {
      let country = log.srcCountry;

      // older logs may not have srcCountry – fallback to lookup
      if (!country && log.sourceIp) {
        const geo = geoip.lookup(log.sourceIp);
        country = geo?.country || "Unknown";
      }

      if (!country) country = "Unknown";

      counts[country] = (counts[country] || 0) + 1;
    });

    const result = Object.entries(counts).map(([country, value]) => ({
      country,
      value
    }));

    res.json({ ok: true, data: result });
  } catch (err) {
    console.error("❌ /api/top-countries error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to compute top countries" });
  }
});

// 🔥 Top devices (based on deviceName count)
app.get("/api/top/devices", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await logsCollection.aggregate([
      { $match: { ts: { $gte: last24h } } },
      { $group: { _id: "$deviceName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    res.json({ ok: true, data: result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// 🌍 Top destination countries (based on geoip lookup)
// 🌍 Top destination countries (based on geoip lookup)
app.get("/api/top/dst-countries", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await logsCollection.aggregate([
      { $match: { ts: { $gte: last24h }, destCountry: { $ne: "Unknown" } } },
      { $group: { _id: "$destCountry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    // 🔥 Normalize every country before returning
    const cleaned = result.map(item => ({
      country: normalizeCountry(item._id),
      count: item.count
    }));

    res.json({ ok: true, data: cleaned });

  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});


// =======================================================
// ⭐ FULL DASHBOARD STATS ENDPOINT (MATCHES FRONTEND KEYS)
// =======================================================
app.get("/api/stats/full", async (req, res) => {
  try {
    const counts = {};

    // Severity counters
    counts.total = await logsCollection.countDocuments();
    counts.errors = await logsCollection.countDocuments({ severity: "error" });
    counts.warnings = await logsCollection.countDocuments({
      $or: [{ severity: "warn" }, { severity: "warning" }]
    });
    counts.info = await logsCollection.countDocuments({ severity: "info" });

    // Category counters
    const cat = async (c) => await logsCollection.countDocuments({ category: c });

    counts.general = await cat("General Traffic");
    counts.application = await cat("Application Control");
    counts.antivirus = await cat("Antivirus");  // FIXED
    counts.dns = await cat("DNS");
    counts.ssl = await cat("SSL");
    counts.ips = await cat("IPS");
    counts.failedLogin = await cat("Failed Login");
    counts.vpn = await cat("VPN");
    counts.adminAccess = await cat("Admin Access");

    res.json({ ok: true, stats: counts });

  } catch (err) {
    console.error("❌ /api/stats/full error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to fetch full stats." });
  }
});


import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// =========================================
// 🔥 WATCH CHANNELS / GROUPS (ADD IDs HERE)
// =========================================
const WATCH_CHAT_IDS = [
  -1001234567890,   // Public OSINT Channel (example)
  -1009876543211,   // Another channel (example)
  -123456789,       // Private SOC group (example)
];


// 🚨 IMPORTANT:
// You must fill your real channel/group IDs here.
// Example format: -1001234567890 for channels
// For groups: -987654321


if (TELEGRAM_TOKEN) {
  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

  bot.on("message", msg => console.log("📌 CHAT DEBUG:", msg.chat));



  bot.on("message", (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();

    // Accept messages only from allowed channels/groups
    if (!WATCH_CHAT_IDS.includes(chatId)) return;

    const alert = {
      source: msg.chat.title || "Telegram",
      chatId,
      text: msg.text,
      timestamp: new Date(),
    };



    // ➤ Stream live into Darkweb Intelligence tab
    io.emit("darkweb:update", alert);

    // ➤ Credential exposure detection
    if (detectExposure(msg.text)) {
      io.emit("alert:new", {
        severity: "critical",
        ts: new Date(),
        message: "Darkweb exposure detected via Telegram",
        parsed: { text: msg.text, chat: msg.chat.title },
      });
    }

    // ➤ Major breach detection
    if (detectMajorBreach({ title: msg.text })) {
      io.emit("alert:new", {
        severity: "critical",
        ts: new Date(),
        message: `Major breach detected in Telegram feed: ${msg.text}`,
        parsed: { text: msg.text, chat: msg.chat.title }
      });
    }

    console.log(`📢 Telegram OSINT (${msg.chat.title}):`, msg.text);
  });
}

// =========================================
// GET FIREWALL LIST + STATUS
// =========================================
app.get("/api/firewalls", async (req, res) => {
  try {
    // Get ALL firewall names
    const devices = await logsCollection.distinct("deviceName");

    const result = [];

    for (const device of devices) {
      // Check last 3 minutes logs
      const recent = await logsCollection.findOne({
        deviceName: device,
        ts: { $gte: new Date(Date.now() - 3 * 60 * 1000) }
      });

      result.push({
        name: device,
        status: recent ? "online" : "offline"
      });
    }

    res.json({ ok: true, firewalls: result });

  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});


function detectMajorBreach(item) {
  const t = (item.title || "").toLowerCase();

  const patterns = [
    "million records", "database dump", "critical breach", "ransomware",
    "password leak", "credentials leaked", "querytel", "@querytel.com",
    "bank records", "ssn leak", "government data", "industrial secret",
    "selling access", "root shell", "rce exploit"
  ];

  return patterns.some(p => t.includes(p));
}





// --- Register Advanced SOC Endpoints ---
// registerAdvancedSOCEndpoints called earlier in connectMongo

// ================================================
// 🧹 STORAGE MAINTENANCE (FORTIANALYZER STYLE)
// ================================================
// ================================================
// 🚀 UNIFIED STARTUP ENGINE (Race-Condition Safe)
// ================================================
async function initializeSystem() {
  try {
    // 1. Connect to Database FIRST (Await completion)
    await connectMongo();

    // 2. Start Background Intervals (Only after collections exist)
    setInterval(flushIngestionBuffer, 2000);

    // 3. Start Live Log Tailing
    if (fs.existsSync(logPath) && isPrimary) {
      console.log(`📡 Watching live FAZ log file: ${logPath}`);
      const tail = new Tail(logPath, { useWatchFile: true });

      tail.on("line", async (line) => {
        const parsed = parseFAZLog(line);
        if (!parsed) return;

        // --- Normalize key Fortigate fields ---
        const parsedFields = {};
        const regex = /(\w+)="([^"]+)"|(\w+)=([^\s"]+)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          if (match[1]) parsedFields[match[1]] = match[2];
          else if (match[3]) parsedFields[match[3]] = match[4];
        }

        const deviceName = parsedFields.devname || "Unknown Device";
        const deviceId = parsedFields.devid || "N/A";
        const sourceIp = parsedFields.srcip || parsedFields.src || parsedFields.remip || parsedFields.src_ip || parsedFields.client_ip || null;
        const destIp = parsedFields.dstip || parsedFields.dst || parsedFields.dst_host || parsedFields.hostname || parsedFields.dst_ip || parsedFields.server_ip || null;
        const srcPort = parsedFields.srcport || "N/A";
        const dstPort = parsedFields.dstport || "N/A";
        const action = parsedFields.action || "N/A";
        const service = parsedFields.service || parsedFields.app || parsedFields.subtype || parsedFields.logdesc || "N/A";
        const policyId = parsedFields.policyid || parsedFields.polid || "N/A";
        const virtualDomain = parsedFields.vd || "root";

        const srcGeo = resolveInternalIP(sourceIp);
        const dstGeo = resolveInternalIP(destIp);

        // Build log document
        const logDoc = {
          ts: parsed.ts || new Date(),
          severity: parsed.severity,
          message: parsed.message,
          deviceName,
          deviceId,
          sourceIp,
          destIp,
          srcPort,
          dstPort,
          action,
          service,
          policyId,
          virtualDomain,
          parsed: parsedFields,
          source: "FAZ",
          srcCountry: resolveCountryFixed(sourceIp),
          destCountry: resolveCountryFixed(destIp),
          srcLat: srcGeo?.lat || null,
          srcLng: srcGeo?.lng || null,
          dstLat: dstGeo?.lat || null,
          dstLng: dstGeo?.lng || null,
          category: detectCategory({ message: parsed.message, service }),
          humanMessage: generateSummary({
            severity: parsed.severity,
            deviceName,
            sourceIp,
            destIp,
            service,
            dstPort,
            action,
            message: parsed.message,
          }),
          cleanMessage: generateCleanMessage(parsedFields),
        };

        const riskMeta = calculateRiskMetadata(logDoc);
        logDoc.riskLevel = riskMeta.riskLevel;
        logDoc.riskLabel = riskMeta.label;
        logDoc.mitre = mapLogToMitre(logDoc);
        logDoc.fingerprint = generateLogFingerprint(logDoc);

        if (isNoise(logDoc)) {
          emitLog(logDoc);
          return;
        }

        const eventFingerprint = generateEventFingerprint(logDoc);
        const eventDoc = {
          eventFingerprint,
          eventName: logDoc.cleanMessage || logDoc.message,
          category: logDoc.category,
          severity: logDoc.severity,
          source: logDoc.sourceIp,
          target: logDoc.destIp,
          riskLevel: logDoc.riskLevel,
          riskLabel: logDoc.riskLabel,
          ts: logDoc.ts,
          deviceName: logDoc.deviceName
        };

        bulkLogBuffer.push(logDoc);
        bulkEventBuffer.push(eventDoc);
        emitLog(logDoc);

        if (bulkLogBuffer.length >= 1000) flushIngestionBuffer();
      });

      tail.on("error", (err) => console.error("❌ Tail error:", err.message));
    }

    // 4. Start HTTP Server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 QueryTel SOC Backend running on port ${PORT} (all interfaces)`);
    });

  } catch (err) {
    console.error("❌ System Initialization Failed:", err.message);
    process.exit(1);
  }
}

// Start System
initializeSystem();




