
const { MongoClient } = require('mongodb');

async function checkVolumes() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('soc');
        const logs = db.collection('logs');

        const lastHour = new Date(Date.now() - 3600000);

        console.log("--- Log Volumes (Last Hour) ---");
        const rawCount = await logs.countDocuments({ ts: { $gte: lastHour }, devname: { $exists: true } });
        const normalizedCount = await logs.countDocuments({ ts: { $gte: lastHour }, deviceName: { $exists: true } });

        console.log("Raw logs (with devname):", rawCount);
        console.log("Normalized logs (with deviceName):", normalizedCount);

        if (normalizedCount > 0) {
            const sample = await logs.findOne({ ts: { $gte: lastHour }, deviceName: { $exists: true } });
            console.log("Normalized Sample Severity:", sample.severity);
            console.log("Normalized Sample Category:", sample.category);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkVolumes();
