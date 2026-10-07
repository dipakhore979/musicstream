import mongoose from "mongoose";
import { assetFields, jsonTransform } from "./plugins.js";

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Song title is required"], trim: true, maxlength: 150 },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
    // Optional: a song without an album is a "single".
    album: { type: mongoose.Schema.Types.ObjectId, ref: "Album", default: null, index: true },
    audio: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    // If empty, the UI falls back to the album's cover.
    coverImage: assetFields(),
    duration: { type: Number, default: 0 }, // seconds, reported by Cloudinary at upload time
    genre: { type: String, default: "", trim: true, maxlength: 50 },
    trackNumber: { type: Number, default: null, min: 1 },
    playCount: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

jsonTransform(songSchema);
export default mongoose.model("Song", songSchema);
