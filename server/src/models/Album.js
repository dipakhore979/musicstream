import mongoose from "mongoose";
import { assetFields, jsonTransform } from "./plugins.js";

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Album title is required"], trim: true, maxlength: 150 },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
    coverImage: assetFields(),
    releaseYear: { type: Number, min: 1900, max: 2100 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

jsonTransform(albumSchema);
export default mongoose.model("Album", albumSchema);
