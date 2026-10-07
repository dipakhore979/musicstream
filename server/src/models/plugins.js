// Shared by the music models so every JSON response uses `id` instead of `_id`/`__v`.
export function jsonTransform(schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}

// { url, publicId } pair for a Cloudinary asset. publicId is needed later to delete the file.
export const assetFields = () => ({
  url: { type: String, default: "" },
  publicId: { type: String, default: "" },
});
