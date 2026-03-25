import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soc";

async function run() {
    const client = new MongoClient(MONGO_URL);
    try {
        await client.connect();
        const db = client.db("soc");
        const logsCollection = db.collection("logs");

        console.log("Connected to MongoDB. Testing Risk Score Logic...");

        const now = Date.now();

        const totalLogs = await logsCollection.countDocuments({});
        console.log(`TOTAL LOGS IN DB: ${totalLogs}`);

        async function checkWindow(windowMs, label) {
            const startTime = new Date(now - windowMs);
            console.log(`\n--- Checking ${label} window (since ${startTime.toISOString()}) ---`);

            const total = await logsCollection.countDocuments({ ts: { $gte: startTime } });
            const errors = await logsCollection.countDocuments({ severity: "error", ts: { $gte: startTime } });
            const warnings = await logsCollection.countDocuments({ severity: { $in: ["warn", "warning"] }, ts: { $gte: startTime } });

            console.log(`Total: ${total}`);
            console.log(`Errors: ${errors}`);
            console.log(`Warnings: ${warnings}`);

            if (total > 0) {
                const riskScore = Math.min(100, Math.round(
                    (errors * 10 + warnings * 3) / Math.max(1, total / 50)
                ));
                console.log(`CALCULATED SCORE: ${riskScore}`);
            } else {
                console.log("Score: 0 (No Data)");
            }
        }

        await checkWindow(1 * 60 * 60 * 1000, "1 Hour");
        await checkWindow(24 * 60 * 60 * 1000, "24 Hours");
        await checkWindow(7 * 24 * 60 * 60 * 1000, "7 Days");
        await checkWindow(30 * 24 * 60 * 60 * 1000, "30 Days");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

run();
