// --- Unified QueryTel SOC + FAZ Monitor Backend ---
// Features:
//  - Live FAZ log streaming from /var/log/faz/faz.log
//  - Chatbot incident logging
//  - AI summary generation
//  - Troubleshooter integration
//  - Zoho Desk ticket creation
//  - Socket.IO realtime alerts
//  - MongoDB log storage and filtering

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


dotenv.config();

// --- Express / Socket.IO Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://10.106.87.146:3000",  // ✅ Your actual frontend IP
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,   // Keep-alive interval
  pingTimeout: 60000,    // Wait longer before disconnect
});



// --- Middleware ---
app.use(
  cors({
    origin: [
      "http://10.106.87.146:3000",  // ✅ your real frontend port
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());


// --- MongoDB Connection ---
const MONGO_URL = "mongodb://localhost:27017";

// declare ONCE (no duplicates elsewhere in file)
let client, db, logsCollection, darkwebHeadlinesCollection;

async function connectMongo() {
  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();

    db = client.db("soc");
    logsCollection = db.collection("logs");
    darkwebHeadlinesCollection = db.collection("darkweb_headlines");

    console.log("✅ Connected to MongoDB (soc)");

    // 🧹 Clear logs on startup (optional)
    const result = await logsCollection.deleteMany({});
    console.log(`🧹 Cleared ${result.deletedCount} old logs from collection`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

await connectMongo();

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
      const filtered = (feed.items || []).filter(looksLikeBreach).map(i => ({
        source: (feed.title || "Feed").replace(/[:\-–].*$/, "").trim(),
        title: i.title,
        link: i.link,
        date: i.isoDate || i.pubDate || new Date().toISOString(),
      }));
      items = items.concat(filtered);
    } catch (e) {
      console.error("OSINT RSS error:", url, e.message);
    }
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
    res.json({ items });
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

function detectSeverity(line) {
  const lower = line.toLowerCase();
  if (lower.includes("error") || lower.includes("critical")) return "error";
  if (lower.includes("warn") || lower.includes("warning") || lower.includes("notice")) return "warning";
  return "info";
}

if (fs.existsSync(logPath)) {
  console.log(`📡 Watching live FAZ log file: ${logPath}`);
  const tail = new Tail(logPath, { useWatchFile: true });

  tail.on("line", async (line) => {
    if (!line.trim()) return;

    // Extract Fortigate-style key=value pairs
    const parsed = {};
    const regex = /(\w+)="([^"]+)"|(\w+)=([^\s"]+)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1]) parsed[match[1]] = match[2];
      else if (match[3]) parsed[match[3]] = match[4];
    }

    const severity = detectSeverity(line);
    const logDoc = {
      ts: new Date(),
      message: line,
      severity,
      parsed,
      source: "FAZ",
    };

    try {
      await logsCollection.insertOne(logDoc);
      io.emit("alert:new", logDoc);

      // Compute quick live stats for chart and summary
      const total = await logsCollection.countDocuments();
      const errors = await logsCollection.countDocuments({ severity: "error" });
      const warnings = await logsCollection.countDocuments({
        $or: [{ severity: "warn" }, { severity: "warning" }],
      });
      const info = await logsCollection.countDocuments({ severity: "info" });

      io.emit("stats:update", { total, errors, warnings, info });
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

// --- FETCH LOGS ---
// --- FETCH LOGS (Paginated) ---
app.get("/logs", async (req, res) => {
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

// --- FILTERED LOG ENDPOINTS ---
app.get("/logs/info", async (req, res) => {
  try {
    const logs = await logsCollection
      .find({ severity: "info" })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch info logs" });
  }
});

app.get("/logs/warning", async (req, res) => {
  try {
    const logs = await logsCollection
      .find({ $or: [{ severity: "warn" }, { severity: "warning" }] })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch warning logs" });
  }
});

app.get("/logs/error", async (req, res) => {
  try {
    const logs = await logsCollection
      .find({ severity: "error" })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch error logs" });
  }
});

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
app.get("/logs/stats", async (req, res) => {
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
app.get("/logs/timeseries", async (req, res) => {
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

//--- Start Server ---
const PORT = process.env.PORT || 3320;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Unified QueryTel SOC + FAZ Backend running on port ${PORT}`);
});

