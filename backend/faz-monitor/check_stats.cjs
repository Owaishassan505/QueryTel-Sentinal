const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    try {
        await client.connect();
        const db = client.db('soc');
        const coll = db.collection('logs');

        console.log('--- Collection Stats ---');
        const stats = await db.command({ collStats: 'logs' });
        console.log('Count:', stats.count);
        console.log('Size (GB):', (stats.size / 1024 / 1024 / 1024).toFixed(2));
        console.log('Avg Obj Size:', stats.avgObjSize);
        console.log('Storage Size (GB):', (stats.storageSize / 1024 / 1024 / 1024).toFixed(2));

        console.log('\n--- Recent Data Check ---');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const countLastHour = await coll.countDocuments({ ts: { $gte: oneHourAgo } });
        console.log('Documents in last 1 hour:', countLastHour);

        const lastDoc = await coll.find().sort({ ts: -1 }).limit(1).toArray();
        if (lastDoc[0]) {
            console.log('Latest Document TS:', lastDoc[0].ts);
            console.log('Current Time:', new Date());
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();
