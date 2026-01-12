const express = require("express");
const router = express.Router();

module.exports = router;

const { MongoClient } = require("mongodb");
const geoip = require("geoip-lite");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = MONGO_URI.includes("mongodb+srv") ? "Quby" : "querytel_monitor";

router.get("/top-countries", async (req, res) => {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db(DB_NAME);

        const logs = await db.collection("faz_events").find().project({ srcip: 1, country: 1 }).toArray();

        const counts = {};

        logs.forEach(log => {
            let country = log.country;

            // fallback for old logs
            if (!country && log.srcip) {
                const lookup = geoip.lookup(log.srcip);
                country = lookup?.country || "Unknown";
            }

            counts[country] = (counts[country] || 0) + 1;
        });

        const formatted = Object.entries(counts).map(([country, value]) => ({ country, value }));

        res.json({ ok: true, data: formatted });

    } catch (err) {
        console.error("Geo Country Error:", err);
        res.json({ ok: false, error: "Top country calculation failed" });
    }
});
