import mongoose from "mongoose";
import { assetFields, jsonTransform } from "./plugins.js";

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Artist name is required"], trim: true, maxlength: 100 },
    bio: { type: String, default: "", trim: true, maxlength: 2000 },
    image: assetFields(),
  },
  { timestamps: true }
);

// Case-insensitive uniqueness: "Luna" and "luna" can't both exist.
artistSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

jsonTransform(artistSchema);
export default mongoose.model("Artist", artistSchema);
