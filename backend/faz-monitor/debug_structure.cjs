
const { MongoClient } = require('mongodb');

async function debugStructure() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('soc');
        const logs = db.collection('logs');

        console.log("--- Latest Log Structure ---");
        const latest = await logs.find({}).sort({ ts: -1 }).limit(1).toArray();

        if (latest.length > 0) {
            console.log(JSON.stringify(latest[0], null, 2));
        } else {
            console.log("No logs found.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

debugStructure();
