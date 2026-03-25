const { MongoClient } = require('mongodb');

async function test() {
    const client = new MongoClient("mongodb://localhost:27017");
    try {
        await client.connect();
        const db = client.db('soc');
        const indexes = await db.collection('logs').indexes();
        console.log("LOGS INDEXES:", JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
test();
