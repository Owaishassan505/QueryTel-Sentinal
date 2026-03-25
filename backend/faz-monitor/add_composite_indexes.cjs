const { MongoClient } = require('mongodb');

async function applyAdvancedIndexes() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('soc');

        console.log("Applying composite indexes to 'logs' collection...");
        
        // For /api/soc/risk-score and /api/soc/events-trend
        await db.collection('logs').createIndex({ ts: -1, severity: 1, level: 1 });
        
        // For /api/soc/mitre-coverage
        await db.collection('logs').createIndex({ ts: -1, category: 1, severity: 1 });
        
        // For /api/soc/kill-chain (various stages)
        await db.collection('logs').createIndex({ ts: -1, category: 1, action: 1 });
        
        // For /api/soc/asset-identity
        await db.collection('logs').createIndex({ ts: -1, sourceIp: 1 });
        
        // For /api/soc/dashboard/kpis & /api/soc/dashboard/sankey
        await db.collection('logs').createIndex({ ts: -1, deviceName: 1, devname: 1 });

        console.log("Applying indexes to 'events' collection...");
        // For event-monitor live feed timeline & pagination
        await db.collection('events').createIndex({ lastSeen: -1, severity: 1 });

        console.log("✅ Advanced composite indexes applied.");
    } catch (err) {
        console.error("❌ Failed to apply indexes:", err.message);
    } finally {
        await client.close();
    }
}
applyAdvancedIndexes();
