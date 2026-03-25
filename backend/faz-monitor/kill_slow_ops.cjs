const { MongoClient } = require('mongodb');

async function killSlowOps() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const adminDb = client.db('admin');
        const currentOps = await adminDb.command({ currentOp: 1 });

        console.log(`Checking ${currentOps.inprog.length} operations...`);

        for (const op of currentOps.inprog) {
            // Kill anything running for more than 10 seconds
            if (op.secs_running > 10) {
                const opId = op.opid;
                console.log(`Killing OpID: ${opId}, Secs: ${op.secs_running}, NS: ${op.ns}, Op: ${op.op}`);
                try {
                    // MONGODB 4.0+ uses "op" field for the opId
                    await adminDb.command({ killOp: 1, op: opId });
                    console.log(`  Successfully sent kill signal to ${opId}`);
                } catch (err) {
                    console.error(`  Failed to kill ${opId}: ${err.message}`);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

killSlowOps();
