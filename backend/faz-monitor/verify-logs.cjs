require('dotenv').config();
const { MongoClient } = require("mongodb");

(async () => {
  const MONGO_URI = process.env.MONGO_URI; // from .env
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db("Quby"); // your Atlas DB name
    const coll = db.collection("faz_events");

    // 1. Count logs by severity
    const bySeverity = await coll.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    console.log("\n=== Logs by severity ===");
    console.table(bySeverity);

    // 2. Show 5 most recent high/critical alerts
    const alerts = await coll.find(
      { severity: { $in: ["high", "critical"] } }
    ).sort({ ingested_at: -1 }).limit(5).toArray();
    console.log("\n=== 5 Most Recent High/Critical Alerts ===");
    console.log(alerts);

  } catch (err) {
    console.error("Error connecting to Atlas:", err.message);
  } finally {
    await client.close();
  }
})();
