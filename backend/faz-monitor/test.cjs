require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { createZohoTicket } = require("./zohoTicket");


const app = express();
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = new URL(MONGO_URI).pathname.replace('/', '') || 'querytel_monitor';

let client, db, coll;

async function connectDB() {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    coll = db.collection('faz_events');
    console.log(`[server] Connected to MongoDB Atlas -> ${DB_NAME}`);
}
connectDB();

// --- Routes ---

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: DB_NAME });
});

// Logs by severity
app.get('/api/severity', async (req, res) => {
    const data = await coll.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
    res.json(data);
});

// Recent alerts
app.get('/api/alerts', async (req, res) => {
    const alerts = await coll.find(
        { severity: { $in: ["high", "critical"] } }
    ).sort({ ingested_at: -1 }).limit(20).toArray();
    res.json(alerts);
});

// Top source IPs
app.get('/api/top-sources', async (req, res) => {
    const sources = await coll.aggregate([
        { $group: { _id: "$srcip", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]).toArray();
    res.json(sources);
});

// Recent logs table
app.get('/api/logs', async (req, res) => {
    const logs = await coll.find().sort({ ingested_at: -1 }).limit(50).toArray();
    res.json(logs);
});

// === Zoho Ticket Creation Route ===
app.post("/api/zoho/tickets", async (req, res) => {
    try {
        const { userName, userEmail, issueDescription } = req.body;
        const result = await createZohoTicket(userName, userEmail, issueDescription);
        res.send(result);
    } catch (err) {
        console.error("❌ Zoho Route Error:", err.message);
        res.status(500).send("❌ Internal Server Error: " + err.message);
    }
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[server] API running at http://localhost:${PORT}`);
});
