
const MongoClient  = require("mongodb");
const uri = "mongodb://localhost:27017"; // Update if necessary
const dbName = "attenomics"; // Replace with your actual database name

const client = new MongoClient(uri);
var db;


exports.initialiseDB = async () => {
    await client.connect();
    db = client.db(dbName)
}


exports.fetchCreators = async () => {
    try {
        const collection = db.collection("creators");
        const creatorsData = await collection.findOne({});
        console.log(creatorsData);
        return creatorsData?.creators || [];
    } catch (err) {
        console.error("Error fetching creators: ", err);
        return [];
    }
};


exports.fetchUsers = async () => {
    try {
        const collection = db.collection("users");
        const usersList = await collection.find().toArray();
        return usersList;

    } catch (err){
        console.error("Error fetching users: ", err);
        return [];
    }
}



exports.updateAttentionRecords = async (creatorsAttentionDist, unixTimestamp, requestHash, responseHash) => {
    try {

        const collection = db.collection('attention_records');
        
        for (const entry of creatorsAttentionDist){
            const {username, attention} = entry;

            await collection.updateOne(
                { creatorName: username }, // Find by creatorName
                { 
                  $push: { 
                    hourly: { 
                      unixTimestamp: unixTimestamp, 
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
        console.error("Error updating records: ", err);
    }
} 


exports.updateUserPercentSupp = async (creator, userSuppDist, unixTimestamp, requestHash, responseHash) => {
    try {
        const collection = db.collection('user_percent_supp');
        const registeredUsers = await fetchUsers();
        const registeredUsernames = new Set(registeredUsers.map(user => user.username));

        for (const entry of userSuppDist){
            const { username, percentBasedSupp } = entry;

            if (!registeredUsernames.has(username)) {
                console.log(`User ${username} is not registered. Skipping update.`);
                continue;
            }

            await collection.updateOne(
                {
                    username: username,
                    "hourly.timestamp": unixTimestamp
                },
                {
                        $push: {
                            'hourly.$.distribution': {
                                    "creatorName":creator,
                                    "percentage":percentBasedSupp,
                                    "reqHash": requestHash,
                                    "resHash": responseHash
                            }
                        }
                },
                { upsert: true }
            );
        }
    } catch (err){
        console.error("Error updating user percent supp:", err);
    } 
}


exports.updateCreatorToCreatorDist = async (creatorsAttentionDist, unixTimestamp) => {
    try {
        const collection = db.collection('hourly_creator_to_creator_attention_records');

        await collection.insertOne({
            "unixTimestamp": unixTimestamp,
            "distribution": creatorsAttentionDist
        })

    } catch (err) {
        console.error("Error updating creator to creator dist:", err)
    } 
}