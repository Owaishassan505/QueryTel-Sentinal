import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import geoip from "geoip-lite";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://10.180.80.168:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🟢 HEALTH CHECK
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// 🟢 LOGIN
app.post("/api/login", (req, res) => {
  res.json({
    token: "demo-token",
    user: { email: "admin@querytel.com", name: "QueryTel Admin" },
  });
});

// 🟢 REAL GEO-IP COUNTRY API
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = MONGO_URI.includes("mongodb+srv")
  ? "Quby"
  : "querytel_monitor";

app.get("/api/top-countries", async (req, res) => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const logs = await db
      .collection("faz_events")
      .find()
      .project({ srcip: 1, country: 1 })
      .toArray();

    const counts = {};

    logs.forEach((log) => {
      let country = log.country;

      if (!country && log.srcip) {
        const lookup = geoip.lookup(log.srcip);
        country = lookup?.country || "Unknown";
      }

      counts[country] = (counts[country] || 0) + 1;
    });

    const formatted = Object.entries(counts).map(([country, value]) => ({
      country,
      value,
    }));

    res.json({ ok: true, data: formatted });
  } catch (err) {
    console.error("Top Countries API Error:", err);
    res.json({ ok: false, error: "Failed to compute country statistics" });
  }
});

export default app;
