const { MongoClient } = require('mongodb');

async function checkPerformance() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('soc');

        console.log("--- Collection Stats ---");
        const collections = ['logs', 'events', 'incidents', 'stats_cache'];
        for (const collName of collections) {
            try {
                const stats = await db.command({ collStats: collName });
                console.log(`Collection: ${collName}`);
                console.log(`  Count: ${stats.count}`);
                console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  StorageSize: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);

                const indexes = await db.collection(collName).indexes();
                console.log("  Indexes:");
                indexes.forEach(idx => console.log(`    - ${JSON.stringify(idx.key)}`));
            } catch (e) {
                console.log(`Error getting stats for ${collName}: ${e.message}`);
            }
        }

        console.log("\n--- Slow Operations (Current) ---");
        const adminDb = client.db('admin');
        const currentOps = await adminDb.command({ currentOp: 1 });
        currentOps.inprog.forEach(op => {
            if (op.secs_running > 2) {
                console.log(`OpID: ${op.opid}, Secs: ${op.secs_running}, NS: ${op.ns}, Op: ${op.op}`);
                if (op.command) {
                    console.log(`  Command: ${JSON.stringify(op.command).substring(0, 500)}...`);
                }
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkPerformance();
