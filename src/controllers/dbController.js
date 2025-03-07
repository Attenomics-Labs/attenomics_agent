const { MongoClient } = require("mongodb");

// Use CONNECTION_URI from the environment; it should include the database name.
const uri = process.env.CONNECTION_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });
let db;

// Immediately connect when the module is loaded and use the default DB from the URI.
(async () => {
  try {
    await client.connect();
    db = client.db(); // No need to pass a dbName—this uses the default from the URI.
    console.log("Database connected using default database from URI");
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
})();

exports.fetchCreators = async () => {
  try {
    const collection = db.collection("creators");
    const creatorsData = await collection.findOne({});
    console.log("Creators data:", creatorsData);
    return creatorsData?.creators || [];
  } catch (err) {
    console.error("Error fetching creators:", err);
    return [];
  }
};

exports.fetchUsers = async () => {
  try {
    const collection = db.collection("users");
    const usersList = await collection.find().toArray();
    return usersList;
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
};

exports.updateAttentionRecords = async (creatorsAttentionDist, unixTimestamp, requestHash, responseHash) => {
  try {
    const collection = db.collection("attention_records");
    for (const entry of creatorsAttentionDist) {
      const { username, attention } = entry;
      await collection.updateOne(
        { creatorName: username },
        { 
          $push: { 
            hourly: { 
              unixTimestamp, 
              latestAttention: attention, 
              reqHash: requestHash, 
              resHash: responseHash
            } 
          } 
        },
        { upsert: true }
      );
      console.log(`Updated attention record for ${username}`);
    }
  } catch (err) {
    console.error("Error updating records:", err);
  }
};

exports.updateUserPercentSupp = async (creator, userSuppDist, unixTimestamp, requestHash, responseHash) => {
  try {
    const collection = db.collection("user_percent_supp");
    const registeredUsers = await exports.fetchUsers();
    const registeredUsernames = new Set(registeredUsers.map(user => user.username));

    for (const entry of userSuppDist) {
      const { username, percentBasedSupp } = entry;
      if (!registeredUsernames.has(username)) {
        console.log(`User ${username} is not registered. Skipping update.`);
        continue;
      }
      await collection.updateOne(
        { 
          username,
          "hourly.timestamp": unixTimestamp
        },
        {
          $push: {
            'hourly.$.distribution': {
              creatorName: creator,
              percentage: percentBasedSupp,
              reqHash: requestHash,
              resHash: responseHash
            }
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Error updating user percent supp:", err);
  }
};

exports.updateCreatorToCreatorDist = async (creatorsAttentionDist, unixTimestamp) => {
  try {
    const collection = db.collection("hourly_creator_to_creator_attention_records");
    await collection.insertOne({
      unixTimestamp,
      distribution: creatorsAttentionDist
    });
  } catch (err) {
    console.error("Error updating creator to creator dist:", err);
  }
};
