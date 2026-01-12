// --- Unified QueryTel SOC + FAZ Monitor Backend ---
// Features:
//  - Live FAZ log streaming from /var/log/faz/faz.log
//  - Chatbot incident logging
//  - AI summary generation
//  - Troubleshooter integration
//  - Zoho Desk ticket creation
//  - Socket.IO realtime alerts
//  - MongoDB log storage and filtering

// --- Unified QueryTel SOC + FAZ Monitor Backend ---
// Features:
//  - Live FAZ log streaming from /var/log/faz/faz.log
//  - Chatbot incident logging
//  - AI summary generation
//  - Troubleshooter integration
//  - Zoho Desk ticket creation
//  - Socket.IO realtime alerts
//  - MongoDB log storage and filtering
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
import { createZohoTicket } from "./zohoTicket.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";



import speakeasy from "speakeasy";
import qrcode from "qrcode";
import geoip from "geoip-lite";

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

// 🧠 Generate user-friendly summary
export function generateSummary(log) {
  const severity = classifySeverity(log.severity);
  const category = detectCategory(log);

  // ⭐ FIXED — use resolveCountryFixed()
  const srcCountry = resolveCountryFixed(log.sourceIp);
  const dstCountry = resolveCountryFixed(log.destIp);

  const srcGeo = geoip.lookup(log.sourceIp);
  const dstGeo = geoip.lookup(log.destIp);

  return `
${severity.icon} **${category} Event (${severity.level.toUpperCase()})**
Device **${log.deviceName || "Unknown"}** recorded ${category} traffic.

- **Source:** ${log.sourceIp || "-"} (${srcCountry})
- **Destination:** ${log.destIp || "-"} (${dstCountry})
- **Service:** ${log.service || "-"}
- **Port:** ${log.dstPort || "-"}
- **Action:** ${log.action || "N/A"}

📝 Message:  
${log.message || "No message"}
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
  const src = f.srcip || f.src || "Unknown";
  const dst = f.dstip || f.dst || "Unknown";
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

// --- Authentication Setup ---
const JWT_SECRET = process.env.JWT_SECRET || "supersecure-querytel-key";

// Dummy users (for now, can later move to MongoDB or LDAP)
const USERS = [
  { email: "soc@querytel.com", password: "Qu3ry1e80!" },
  { email: "security@querytel.com", password: "SOC@12345" },
];

// --- Express / Socket.IO Setup ---
const app = express();
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

app.use(
  session({
    secret: "querytel-soc-session",
    resave: false,
    saveUninitialized: false,
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
    "querytel",
    "@querytel.com",
    "credentials",
    "password",
    "pass=",
    "pwd=",
    "leak",
    "database dump",
    "email: password",
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

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soc";

let client, db, logsCollection, darkwebHeadlinesCollection;

async function connectMongo() {
  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();

    db = client.db(process.env.MONGO_DB || "soc");
    logsCollection = db.collection(process.env.MONGO_COLLECTION || "logs");
    darkwebHeadlinesCollection = db.collection("darkweb_headlines");

    console.log(`✅ Connected to MongoDB (${process.env.MONGO_DB || "soc"})`);

    // optional: clear logs on startup
    const result = await logsCollection.deleteMany({});
    console.log(`🧹 Cleared ${result.deletedCount} old logs from collection`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

await connectMongo();

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
      const ai = await axios.post("http://127.0.0.1:8000/summary", {
        text: JSON.stringify(lastLogs)
      });
      aiSummary = ai.data.summary || ai.data;
    } catch (err) {
      console.error("AI Summary Engine Error:", err.message);
    }

    res.json({ summary: aiSummary });
  } catch (err) {
    res.status(500).json({ error: "Failed to create AI summary." });
  }
});


app.post("/api/analysis/filter", async (req, res) => {
  try {
    const { severity, category, device, srcCountry, dstCountry, start, end } = req.body;

    const query = {};

    if (severity) query.severity = severity;
    if (category) query.category = category;
    if (device) query.deviceName = device;
    if (srcCountry) query.srcCountry = srcCountry;
    if (dstCountry) query.destCountry = dstCountry;

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
    res.status(500).json({ error: "Filtering failed." });
  }
});



// --- Threat Insights Model ---
import mongoose from "mongoose";

const ThreatInsightsSchema = new mongoose.Schema({
  type: String,
  severity: String,
  description: String,
  timestamp: String
});

export const ThreatInsightsModel = mongoose.model("ThreatInsights", ThreatInsightsSchema);

setInterval(async () => {
  try {
    const total = await logsCollection.estimatedDocumentCount();

    // Severity
    const errors = await logsCollection.countDocuments({ severity: "error" });
    const warnings = await logsCollection.countDocuments({
      $or: [{ severity: "warn" }, { severity: "warning" }],
    });
    const info = await logsCollection.countDocuments({ severity: "info" });

    // Categories (🔥 THIS WAS MISSING)
    const general = await logsCollection.countDocuments({ category: "General Traffic" });
    const application = await logsCollection.countDocuments({ category: "Application Control" });
    const antivirus = await logsCollection.countDocuments({ category: "Antivirus" });
    const dns = await logsCollection.countDocuments({ category: "DNS" });
    const ssl = await logsCollection.countDocuments({ category: "SSL" });
    const ips = await logsCollection.countDocuments({ category: "IPS" });
    const failedLogin = await logsCollection.countDocuments({ category: "Failed Login" });
    const vpn = await logsCollection.countDocuments({ category: "VPN" });
    const adminAccess = await logsCollection.countDocuments({ category: "Admin Access" });

    io.emit("stats:update", {
      total,
      errors,
      warnings,
      info,

      general,
      application,
      antivirus,
      dns,
      ssl,
      ips,
      failedLogin,
      vpn,
      adminAccess
    });

  } catch (err) {
    console.error("❌ Stats update failed:", err.message);
  }
}, 5000);





// Darkweb / Breach OSINT headlines cache (Mongo)
//var darkwebHeadlinesCollection = db.collection("darkweb_headlines");

// ===== Darkweb / Breach OSINT (free, no key) =====
const rss = new Parser();
const osintCache = new NodeCache({ stdTTL: 60 }); // 60s cache

// Reputable breach/leak headlines (public RSS)
const FEEDS = [
  "https://www.bleepingcomputer.com/feed/",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://www.databreaches.net/feed/",
];

// simple keyword filter
const KEYWORDS = [
  "breach", "data breach", "leak", "leaked", "database", "ransomware",
  "credentials", "records", "exposed", "pwned", "passwords", "dark web",
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


  // sort newest first, keep 50
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  items = items.slice(0, 50);

  osintCache.set("osint", items, 60);

  try {
    for (const it of items) {
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
}, 60_000);

// === REAL DATABASE-DRIVEN THREAT INSIGHTS ===
app.get("/api/threat-insights", async (req, res) => {
  try {
    const insights = await ThreatInsightsModel.find()
      .sort({ timestamp: -1 })
      .limit(50);

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



// --- DARKWEB LIVE STREAM (simulated or connected feed) ---
let darkwebActivity = [
  { source: "Telegram", breaches: 18 },
  { source: "Reddit Leaks", breaches: 11 },
  { source: "Pastebin", breaches: 8 },
  { source: "Dark Forums", breaches: 14 },
  { source: "Breached.to", breaches: 21 },
];

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

syslogServer.bind(SYSLOG_PORT, "0.0.0.0");

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

let logBuffer = [];
let logThrottleActive = false;


if (fs.existsSync(logPath)) {
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

    // Extract common FortiGate fields (with graceful fallbacks)
    const deviceName = parsedFields.devname || "Unknown Device";
    const deviceId = parsedFields.devid || "N/A";
    const sourceIp = parsedFields.srcip || parsedFields.src || "Unknown Source";
    const destIp = parsedFields.dstip || parsedFields.dst || "Unknown Destination";

    const srcPort = parsedFields.srcport || "N/A";   // ✅ ADD THIS
    const dstPort = parsedFields.dstport || "N/A";   // ✅ ADD THIS

    const action = parsedFields.action || "N/A";
    const service = parsedFields.service || parsedFields.app || "N/A";
    const policyId = parsedFields.policyid || "N/A";
    const policyType = parsedFields.policytype || "N/A";
    const virtualDomain = parsedFields.vd || "root";


    // Convert FAZ 'eventtime' to readable timestamp (if exists)
    let readableTime = new Date();
    if (parsedFields.eventtime && !isNaN(parsedFields.eventtime)) {
      const epochMs = String(parsedFields.eventtime).length > 13
        ? Number(parsedFields.eventtime.slice(0, 13))
        : Number(parsedFields.eventtime);
      readableTime = new Date(epochMs);
    }

    // =====================================================
    // 🌍 GEO FIX FOR INTERNAL IPs (LAN → Firewall Location)
    // =====================================================
    // =====================================================
    // 🌍 GEO FIX FOR INTERNAL IPs (LAN → Toronto Datacenter)
    // =====================================================
    function resolveInternalIP(ip) {
      if (!ip) return null;

      // RFC1918 internal network ranges
      const privateRanges = [
        "10.",
        "192.168.",
        "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.",
        "172.24.", "172.25.", "172.26.", "172.27.",
        "172.28.", "172.29.", "172.30.", "172.31."
      ];

      // If IP is inside private network → map to Toronto SOC
      if (privateRanges.some(prefix => ip.startsWith(prefix))) {
        return {
          lat: 43.6532,   // Toronto Latitude
          lng: -79.3832   // Toronto Longitude
        };
      }

      // Public IP Lookup
      const geo = geoip.lookup(ip);
      if (geo && geo.ll) {
        return {
          lat: geo.ll[0],
          lng: geo.ll[1]
        };
      }

      return null;
    }



    // Combine normalized + parsed data
    // Combine normalized + parsed data
    // ⭐ GEO LOOKUP FOR MAP
    const srcGeo = resolveInternalIP(sourceIp);
    const dstGeo = resolveInternalIP(destIp);

    // ---------------------
    // Build log document
    // ---------------------
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
      policyType,
      virtualDomain,
      parsed: parsedFields,
      source: "FAZ",

      // FIXED COUNTRY FIELDS
      srcCountry: resolveCountryFixed(sourceIp),
      destCountry: resolveCountryFixed(destIp),

      // This is used somewhere else – leave it but switch to Fixed too:
      country: resolveCountryFixed(sourceIp),

      category: detectCategory({
        message: parsed.message,
        service,
      }),

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


    // ⭐ GEO COORDINATES ATTACHMENT
    logDoc.srcLat = srcGeo?.lat || null;
    logDoc.srcLng = srcGeo?.lng || null;

    logDoc.dstLat = dstGeo?.lat || null;
    logDoc.dstLng = dstGeo?.lng || null;



    try {

      await logsCollection.insertOne(logDoc);


      // Add to batch buffer
      logBuffer.push(logDoc);

      // Send batch every 300ms
      if (!logThrottleActive) {
        logThrottleActive = true;
        setTimeout(() => {
          io.emit("alert:batch", logBuffer);
          logBuffer = [];
          logThrottleActive = false;
        }, 300);
      }











      console.log(`📥 Ingested log → [${parsed.severity.toUpperCase()}] ${parsed.message}`);
    } catch (err) {
      console.error("❌ Mongo insert error:", err.message);
    }
  });

  tail.on("error", (err) => console.error("❌ Tail error:", err.message));
} else {
  console.error(`❌ Log file not found: ${logPath}`);
}


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

    const logs = await logsCollection
      .find()
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
    const logs = await logsCollection
      .find({ severity: { $in: ["warn", "warning"] } })
      .sort({ ts: -1 })
      .limit(200)
      .toArray();

    res.json(logs);
  } catch (err) {
    console.error("❌ Failed to fetch warning logs:", err.message);
    res.status(500).json({ error: "Failed to fetch warning logs" });
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
    const data = await logsCollection
      .aggregate([
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
app.get("/api/health", async (req, res) => {
  try {
    const start = performance.now();

    // ✅ Basic server metrics
    const uptimeSec = process.uptime();
    const mem = process.memoryUsage();
    const load = os.loadavg()[0];

    // ✅ MongoDB status
    const mongoStatus = logsCollection ? "Connected" : "Disconnected";

    // ✅ Quick log stats
    const activeErrors = await logsCollection.countDocuments({ severity: "error" });
    const activeWarnings = await logsCollection.countDocuments({
      $or: [{ severity: "warn" }, { severity: "warning" }],
    });

    const end = performance.now();
    const latency = Math.round(end - start);

    res.json({
      status: "Healthy",
      uptime: Math.round(uptimeSec),
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      load: Number(load.toFixed(2)),
      mongo: mongoStatus,
      activeAlerts: activeErrors + activeWarnings,
      latency,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ /api/health error:", err.message);
    res.status(500).json({ status: "Offline", error: err.message });
  }
});



// --- ZOHO TICKET MANUAL TEST ENDPOINT ---
app.post("/api/zoho/tickets", async (req, res) => {
  try {
    const { userName, userEmail, issueDescription } = req.body;
    console.log("🎟️ Creating Zoho Ticket via /api/zoho/tickets");

    const result = await createZohoTicket(
      userName || "User",
      userEmail || "noreply@querytel.com",
      issueDescription || "No description provided."
    );

    res.send(result);
  } catch (err) {
    console.error("❌ Zoho Route Error:", err.message);
    res.status(500).send("❌ Internal Server Error: " + err.message);
  }
});

// === PUBLIC ROUTES for Dashboard Summary ===

// Public stats for summary cards


// Public timeseries data
// === PUBLIC ROUTES for Dashboard and Analysis ===
app.get("/api/logs/stats", async (_req, res) => {
  try {
    const total = await logsCollection.countDocuments();
    const info = await logsCollection.countDocuments({ severity: "info" });
    const errors = await logsCollection.countDocuments({ severity: "error" });
    const warnings = await logsCollection.countDocuments({
      $or: [{ severity: "warn" }, { severity: "warning" }],
    });

    // NEW counters:
    const general = await logsCollection.countDocuments({ category: "General Traffic" });
    const application = await logsCollection.countDocuments({ category: "Application Control" });
    const antivirus = await logsCollection.countDocuments({ category: "Web Filter" });

    const dns = await logsCollection.countDocuments({ category: "DNS" });
    const ssl = await logsCollection.countDocuments({ category: "SSL" });
    const ips = await logsCollection.countDocuments({ category: "IPS" });
    const failedLogin = await logsCollection.countDocuments({ category: "Failed Login" });
    const vpn = await logsCollection.countDocuments({ category: "VPN" });
    const adminAccess = await logsCollection.countDocuments({ category: "Admin Access" });

    res.json({
      total,
      info,
      errors,
      warnings,
      general,
      application,
      antivirus,
      dns,
      ssl,
      ips,
      failedLogin,
      vpn,
      adminAccess
    });
  } catch (err) {
    console.error("❌ /api/logs/stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch log stats" });
  }
});



// ====================== LOG ROUTES ===========================


// ========== FINAL CLEAN LOG ROUTES (USE THIS ONLY) ==========
app.get("/api/logs/info", verifyToken, async (req, res) => {
  try {
    const logs = await logsCollection
      .find({ severity: "info" })
      .sort({ ts: -1 })
      .limit(200)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch info logs" });
  }
});

app.get("/api/logs/error", verifyToken, async (req, res) => {
  try {
    const logs = await logsCollection
      .find({ severity: "error" })
      .sort({ ts: -1 })
      .limit(200)
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
    const result = await logsCollection.aggregate([
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
    const result = await logsCollection.aggregate([
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
    const result = await logsCollection.aggregate([
      { $match: { destCountry: { $ne: "Unknown" } } },
      { $group: { _id: "$destCountry", count: { $sum: 1 } } },

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
    "million records",
    "database dump",
    "critical breach",
    "ransomware",
    "password leak",
    "credentials leaked",
    "querytel",
    "@querytel.com",
  ];

  return patterns.some(p => t.includes(p));
}





// --- Start Server ---
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 QueryTel SOC Backend running on port ${PORT} (all interfaces)`);
});




