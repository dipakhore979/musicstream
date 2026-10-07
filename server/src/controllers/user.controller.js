import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { deleteAsset, uploadAvatar } from "../utils/cloudinaryUpload.js";

// PATCH /api/users/me  (multipart: optional "name" text field and optional "avatar" file)
export const updateMe = asyncHandler(async (req, res) => {
  const user = req.user; // loaded by `protect`
  const { name } = req.body;
  if (name === undefined && !req.file) throw ApiError.badRequest("Nothing to update");

  let newAvatar;
  const oldPublicId = user.avatar?.publicId;
  try {
    if (req.file) {
      newAvatar = await uploadAvatar(req.file);
      user.avatar = newAvatar;
    }
    if (name !== undefined) user.name = name;
    await user.save();
  } catch (err) {
    if (newAvatar) await deleteAsset(newAvatar.publicId); // don't orphan the new upload
    throw err;
  }
  if (newAvatar && oldPublicId) await deleteAsset(oldPublicId);

  sendSuccess(res, { message: "Profile updated", data: user });
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  const oldPublicId = user.avatar?.publicId;

  user.avatar = { url: "", publicId: "" };
  await user.save();
  await deleteAsset(oldPublicId);

  sendSuccess(res, { message: "Photo removed", data: user });
});
