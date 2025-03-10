const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DistributionEntrySchema = new Schema({
  username: { type: String, required: true },
  percentBasedSupp: { type: Number, required: true }
});

const SixHourSchema = new Schema({
  unixTimestamp: { type: Number, required: true },
  distribution: { type: [DistributionEntrySchema], default: [] },
  reqHash: { type: String, required: true },
  resHash: { type: String, required: true },
  // Optionally, you can store additional metrics (e.g. latestAttention)
  latestAttention: { type: Number, default: 0 }
});

const UserSupportDistSchema = new Schema(
  {
    creatorName: { type: String, required: true },
    sixHours: { type: [SixHourSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSupportDist", UserSupportDistSchema, "user_percent_supp");
