import Like from "../models/Like.js";
import Song from "../models/Song.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildPageMeta, getPagination, sendSuccess } from "../utils/apiResponse.js";
import { SONG_POPULATE } from "../utils/populate.js";

// Paginated liked songs, newest like first.
export const listLikedSongs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [likes, total] = await Promise.all([
    Like.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Like.countDocuments(filter),
  ]);

  const songs = await Song.find({ _id: { $in: likes.map((l) => l.song) } }).populate(SONG_POPULATE);
  const byId = new Map(songs.map((s) => [String(s._id), s]));
  const ordered = likes.map((l) => byId.get(String(l.song))).filter(Boolean);

  sendSuccess(res, { data: ordered, meta: buildPageMeta({ page, limit, total }) });
});

// Just the ids: the client uses these to paint every heart in the UI with a single request.
export const getLikedIds = asyncHandler(async (req, res) => {
  const likes = await Like.find({ user: req.user._id }).select("song").lean();
  sendSuccess(res, { data: likes.map((l) => String(l.song)) });
});

// PUT/DELETE are idempotent, so repeated clicks or retries are harmless.
export const likeSong = asyncHandler(async (req, res) => {
  const { songId } = req.params;
  if (!(await Song.exists({ _id: songId }))) throw ApiError.notFound("Song not found");
  try {
    await Like.create({ user: req.user._id, song: songId });
  } catch (err) {
    if (err.code !== 11000) throw err; // already liked: fine
  }
  sendSuccess(res, { message: "Added to Liked Songs" });
});

export const unlikeSong = asyncHandler(async (req, res) => {
  await Like.deleteOne({ user: req.user._id, song: req.params.songId });
  sendSuccess(res, { message: "Removed from Liked Songs" });
});
