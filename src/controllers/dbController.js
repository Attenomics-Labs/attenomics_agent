const { MongoClient } = require("mongodb");

// Use CONNECTION_URI from the environment; it should include the database name.
const uri = process.env.CONNECTION_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });
let db;

// Immediately connect when the module is loaded and use the default DB from the URI.
(async () => {
  try {
    await client.connect();
    db = client.db(); // Uses the default DB from the URI.
    console.log("Database connected using default database from URI");
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
})();

/**
 * Fetch creators from the "creatorlists" collection.
 */
exports.fetchCreators = async () => {
  try {
    const collection = db.collection("creatorlists");
    const creatorsData = await collection.findOne({});
    console.log("Creators data:", creatorsData);
    console.log("Full creators document:", JSON.stringify(creatorsData, null, 2));
    console.log("Creator names array:", creatorsData?.creatorNames || []);
    return creatorsData?.creatorNames || [];
  } catch (err) {
    console.error("Error fetching creators:", err);
    return [];
  }
};

/**
 * Fetch registered users from the "users" collection.
 */
const fetchUsers = async () => {
  try {
    const collection = db.collection("users");
    const usersList = await collection.find().toArray();
    return usersList;
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
};

/**
 * Update the creator's attention record using a six‐hour time window.
 */
exports.updateAttentionRecords = async (creatorsAttentionDist, unixTimestamp, requestHash, responseHash) => {
  try {
    const collection = db.collection("attentions");
    for (const entry of creatorsAttentionDist) {
      const { username, attention } = entry;
      // Fetch the existing document for this creator.
      const existingDoc = await collection.findOne({ creatorName: username });
      let newTotal = attention;
      if (existingDoc && typeof existingDoc.totalAttention === "number") {
        newTotal = existingDoc.totalAttention + attention;
      }
      // Update (or upsert) the document by pushing a new six-hour record
      await collection.updateOne(
        { creatorName: username },
        {
          $push: {
            sixHours: {
              unixTimestamp,
              latestAttention: attention,
              reqHash: requestHash,
              resHash: responseHash,
            },
          },
          $set: { totalAttention: newTotal },
        },
        { upsert: true }
      );
      console.log(`Updated attention record for ${username}`);
    }
  } catch (err) {
    console.error("Error updating attention records:", err);
  }
};

/**
 * Update user percentage support for a creator.
 * This function uses the "user_percent_supp" collection only.
 * It filters the provided userSuppDist (which should be an array) and then pushes a new six-hour record if the filtered distribution is nonempty.
 */
exports.updateUserPercentSupp = async (creator, userSuppDist, unixTimestamp, requestHash, responseHash) => {
  try {
    const collection = db.collection("user_percent_supp");
    const registeredUsers = await fetchUsers();
    const registeredUsernames = new Set(registeredUsers.map((user) => user.username));

    console.log("Received userSuppDist:", JSON.stringify(userSuppDist, null, 2));
    console.log("Type of userSuppDist:", typeof userSuppDist);

    let filteredUserSuppDist = [];
    if (Array.isArray(userSuppDist)) {
      // Process each entry – if the entry has a "users" array, extract the objects from it.
      filteredUserSuppDist = userSuppDist.flatMap((entry) => {
        console.log("Processing user entry:", entry);
        if (entry.users && Array.isArray(entry.users)) {
          return entry.users
            .filter((u) => u && u.username && registeredUsernames.has(u.username))
            .map((u) => ({
              username: u.username,
              percentBasedSupp: u.percentBasedSupp,
            }));
        } else if (entry.username) {
          return registeredUsernames.has(entry.username)
            ? [{ username: entry.username, percentBasedSupp: entry.percentBasedSupp }]
            : [];
        } else {
          return [];
        }
      });
    } else {
      console.log("userSuppDist is not an array.");
    }
    
    console.log("Filtered userSuppDist:", JSON.stringify(filteredUserSuppDist, null, 2));
    if (filteredUserSuppDist.length === 0) {
      console.log(`Filtered userSuppDist is empty for creator ${creator}. Skipping update.`);
      return;
    }

    // Push the new record into the "sixHours" array field.
    await collection.updateOne(
      { creatorName: creator },
      {
        $push: {
          sixHours: {
            unixTimestamp,
            distribution: filteredUserSuppDist,
            reqHash: requestHash,
            resHash: responseHash,
          },
        },
      },
      { upsert: true }
    );

    console.log(`Updated user percent support for creator ${creator} in sixHours field.`);
  } catch (err) {
    console.error("Error updating user percent support:", err);
  }
};

/**
 * Update creator-to-creator attention distribution.
 */
exports.updateCreatorToCreatorDist = async (creatorsAttentionDist, unixTimestamp) => {
  try {
    const collection = db.collection("attentions");
    await collection.insertOne({
      unixTimestamp,
      distribution: creatorsAttentionDist,
    });
  } catch (err) {
    console.error("Error updating creator-to-creator distribution:", err);
  }
};

/**
 * New function: updateCreatorTweetMetrics
 * For a given creator, store an array of tweet metrics objects
 * in the "creator_tweet_metrics" collection.
 */
exports.updateCreatorTweetMetrics = async (creator, tweetMetrics) => {
  try {
    if (!Array.isArray(tweetMetrics) || tweetMetrics.length === 0) {
      console.log(`No tweet metrics to update for ${creator}. Skipping...`);
      return;
    }
    const collection = db.collection("creator_tweet_metrics");
    await collection.updateOne(
      { creatorName: creator },
      { $push: { tweets: { $each: tweetMetrics } } },
      { upsert: true }
    );
    console.log(`Updated tweet metrics for ${creator}`);
  } catch (err) {
    console.error("Error updating tweet metrics:", err);
  }
};
