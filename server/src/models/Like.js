import mongoose from "mongoose";

// One document per (user, song). A separate collection (instead of an array on User) keeps liked
// songs ordered by when they were liked, stays fast with thousands of likes, and avoids unbounded arrays.
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

likeSchema.index({ user: 1, song: 1 }, { unique: true }); // can't like the same song twice
likeSchema.index({ user: 1, createdAt: -1 }); // fast "newest likes first"

export default mongoose.model("Like", likeSchema);
