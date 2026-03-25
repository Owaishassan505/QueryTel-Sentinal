
const { MongoClient } = require('mongodb');

async function debugData() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('soc');
        const logs = db.collection('logs');
        const incidents = db.collection('incidents');

        console.log("--- Collection Counts (Approx) ---");
        console.log("Logs total:", await logs.estimatedDocumentCount());
        console.log("Incidents total:", await incidents.estimatedDocumentCount());

        const now = Date.now();
        const lastHour = new Date(now - 3600000);
        const last24h = new Date(now - 24 * 3600000);

        console.log("\n--- Time Windows ---");
        console.log("Current Time:", new Date(now).toISOString());
        console.log("Last 1h Start:", lastHour.toISOString());
        console.log("Last 24h Start:", last24h.toISOString());

        console.log("\n--- Checking for Data in Last Hour ---");
        // Find one log in last hour to verify existence and format
        const sample1h = await logs.findOne({ ts: { $gte: lastHour } });

        if (sample1h) {
            console.log("Log found in last hour!");
            console.log("Sample Severity:", sample1h.severity);
            console.log("Sample Category:", sample1h.category);
            console.log("Sample ts:", sample1h.ts, "Type:", typeof sample1h.ts);
        } else {
            console.log("No logs found in last hour. Checking last 24h...");
            const sample24h = await logs.findOne({ ts: { $gte: last24h } });
            if (sample24h) {
                console.log("Log found in last 24h!");
                console.log("Sample ts:", sample24h.ts, "Type:", typeof sample24h.ts);
                console.log("Sample Severity:", sample24h.severity);
            } else {
                console.log("No logs found in last 24h either.");
                const absoluteLatest = await logs.findOne({}, { sort: { ts: -1 } });
                if (absoluteLatest) {
                    console.log("Absolute latest log found at:", absoluteLatest.ts);
                } else {
                    console.log("No logs found in the collection at all!");
                }
            }
        }

        console.log("\n--- Checking Severity Values ---");
        const distinctSeverities = await logs.distinct("severity");
        console.log("Distinct severities in collection:", distinctSeverities);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

debugData();
