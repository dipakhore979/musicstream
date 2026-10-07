import mongoose from "mongoose";
import { jsonTransform } from "./plugins.js";

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Playlist name is required"], trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Order matters: this array is the playlist's track order.
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  },
  { timestamps: true }
);

jsonTransform(playlistSchema);
export default mongoose.model("Playlist", playlistSchema);
