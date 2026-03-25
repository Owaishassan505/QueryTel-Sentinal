const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    try {
        await client.connect();
        const db = client.db('soc');
        const coll = db.collection('logs');
        const doc = await coll.findOne();
        if (doc) {
            console.log('Sample Document TS:', doc.ts, typeof doc.ts);
            if (doc.ts instanceof Date) {
                console.log('TS is a Date object');
            } else {
                console.log('TS is NOT a Date object');
            }
        } else {
            console.log('No documents found in soc.logs');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();
