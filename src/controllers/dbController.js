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
    const collection = db.collection("creatorlists");
    const creatorsData = await collection.findOne({});

    console.log("Creators data:", creatorsData);
    
    // Log the full document
    console.log("Full creators document:", JSON.stringify(creatorsData, null, 2));
    
    // Log just the creator names array
    console.log("Creator names array:", creatorsData?.creatorNames || []);
    
    // Return the creator names array
    return creatorsData?.creatorNames || [];
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
    // Convert creatorsAttentionDist to an array if it's not already one.
    if (!Array.isArray(creatorsAttentionDist)) {
      creatorsAttentionDist = Object.entries(creatorsAttentionDist).map(([username, attention]) => ({
        username,
        attention
      }));
      console.log("Converted creatorsAttentionDist to array:", creatorsAttentionDist);
    }

    const collection = db.collection("attentions");
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

    console.log("In updateUserPercentSupp, received userSuppDist:", userSuppDist);
    console.log("Type of userSuppDist:", typeof userSuppDist);

    // Convert userSuppDist to an array if it isn't one already.
    if (!Array.isArray(userSuppDist)) {
      userSuppDist = Object.entries(userSuppDist).map(([key, value]) => ({
        username: key,
        percentBasedSupp: value
      }));
      console.log("Converted userSuppDist to array:", userSuppDist);
    }

    for (const entry of userSuppDist) {
      const { username, percentBasedSupp } = entry;
      
      // Check if the username is registered. If not, log and skip.
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
    const collection = db.collection("attentions");
    await collection.insertOne({
      unixTimestamp,
      distribution: creatorsAttentionDist
    });
  } catch (err) {
    console.error("Error updating creator to creator dist:", err);
  }
};

const updateCreatorHourlyRecord = async (creatorName, unixTimestamp, latestAttention, reqHash, resHash) => {
  try {
    console.log(`Updating hourly record for creator: ${creatorName}`);
    
    // Find the existing document for this creator
    const existingRecord = await CreatorHourlyRecord.findOne({ creatorName });
    
    if (existingRecord) {
      // Update existing document by pushing new hourly record
      const updatedRecord = await CreatorHourlyRecord.findOneAndUpdate(
        { creatorName },
        {
          $push: {
            hourly: {
              unixTimestamp,
              latestAttention,
              reqHash,
              resHash
            }
          }
        },
        { new: true }
      );
      console.log(`Updated existing record for ${creatorName}`);
      return updatedRecord;
    } else {
      // Create new document if it doesn't exist
      const newRecord = await CreatorHourlyRecord.create({
        creatorName,
        hourly: [{
          unixTimestamp,
          latestAttention,
          reqHash,
          resHash
        }]
      });
      console.log(`Created new record for ${creatorName}`);
      return newRecord;
    }
  } catch (error) {
    console.error(`Error updating hourly record for ${creatorName}:`, error);
    throw error;
  }
};
