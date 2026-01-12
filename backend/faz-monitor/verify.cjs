const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const db = client.db("querytel_monitor");
  const coll = db.collection("faz_events");

  const count = await coll.countDocuments();
  console.log("Total documents:", count);

  const sample = await coll.findOne();
  console.log("Sample document:", sample);

  await client.close();
})();
