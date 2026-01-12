const fs = require("fs");
const { MongoClient } = require("mongodb");

(async () => {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const db = client.db("querytel_monitor");
  const coll = db.collection("faz_events");

  // Fetch 10 sample docs
  const docs = await coll.find().limit(10).toArray();

  // Write to JSON file
  fs.writeFileSync("sample-logs.json", JSON.stringify(docs, null, 2));

  console.log("✅ Exported", docs.length, "logs to sample-logs.json");

  await client.close();
})();
