const { MongoClient } = require('mongodb');

async function applyIndexes() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('soc');

        console.log("Applying indexes to 'logs' collection...");
        // Use createIndex instead of ensureIndex
        await db.collection('logs').createIndex({ ts: -1 });
        await db.collection('logs').createIndex({ severity: 1 });
        await db.collection('logs').createIndex({ category: 1 });
        await db.collection('logs').createIndex({ destCountry: 1 });
        await db.collection('logs').createIndex({ deviceName: 1 });

        console.log("Applying indexes to 'events' collection...");
        await db.collection('events').createIndex({ lastSeen: -1 });
        await db.collection('events').createIndex({ severity: 1 });
        await db.collection('events').createIndex({ category: 1 });

        console.log("✅ Essential indexes applied.");
    } catch (err) {
        console.error("❌ Failed to apply indexes:", err.message);
    } finally {
        await client.close();
    }
}

applyIndexes();
