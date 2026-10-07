import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "./ApiError.js";

function uploadBuffer(buffer, options) {
  if (!isCloudinaryConfigured) {
    throw ApiError.badRequest("File storage is not configured on the server (missing CLOUDINARY_* env vars)");
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(new ApiError(502, `File upload failed: ${err.message}`));
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function uploadImage(file, folder) {
  const result = await uploadBuffer(file.buffer, {
    folder: `musicstream/${folder}`,
    resource_type: "image",
    // Cap dimensions and let Cloudinary pick a good quality: covers never need to be huge.
    transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function uploadAudio(file) {
  // Cloudinary stores audio under the "video" resource type.
  const result = await uploadBuffer(file.buffer, {
    folder: "musicstream/songs",
    resource_type: "video",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: Math.round(result.duration || 0),
  };
}

// Best-effort cleanup: a failure here should never fail the request, so we only log it.
export async function deleteAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err.message);
  }
}

// Avatars are cropped to a 400x400 square around the most interesting part of the photo.
export async function uploadAvatar(file) {
  const result = await uploadBuffer(file.buffer, {
    folder: "musicstream/avatars",
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto", quality: "auto" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}
