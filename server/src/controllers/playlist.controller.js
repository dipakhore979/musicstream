import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildPageMeta, getPagination, sendSuccess } from "../utils/apiResponse.js";
import { SONG_POPULATE } from "../utils/populate.js";

// Playlists are private. A playlist that exists but belongs to someone else gets the same 404
// as a missing one, so ids can't be probed.
async function findOwned(id, userId) {
  const playlist = await Playlist.findOne({ _id: id, owner: userId });
  if (!playlist) throw ApiError.notFound("Playlist not found");
  return playlist;
}

const coverOf = (song) => song.coverImage?.url || song.album?.coverImage?.url || "";

// One query for the cover art of every playlist on the page (no N+1).
async function loadCoverMap(playlists) {
  const ids = [...new Set(playlists.flatMap((p) => p.songs.slice(0, 12).map(String)))];
  if (!ids.length) return new Map();
  const songs = await Song.find({ _id: { $in: ids } })
    .select("coverImage album")
    .populate({ path: "album", select: "coverImage" });
  return new Map(songs.map((s) => [String(s._id), coverOf(s)]));
}

// Compact shape for lists: no song array, just a count and up to 4 distinct covers for the mosaic.
function toListItem(playlist, coverMap) {
  const covers = [];
  for (const id of playlist.songs.slice(0, 12)) {
    const url = coverMap.get(String(id));
    if (url && !covers.includes(url)) covers.push(url);
    if (covers.length === 4) break;
  }
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    songCount: playlist.songs.length,
    covers,
    updatedAt: playlist.updatedAt,
  };
}

export const listPlaylists = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { owner: req.user._id };

  const [items, total] = await Promise.all([
    Playlist.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Playlist.countDocuments(filter),
  ]);
  const coverMap = await loadCoverMap(items);

  sendSuccess(res, {
    data: items.map((p) => toListItem(p, coverMap)),
    meta: buildPageMeta({ page, limit, total }),
  });
});

export const getPlaylist = asyncHandler(async (req, res) => {
  const playlist = await findOwned(req.params.id, req.user._id);

  // $in doesn't preserve order, so re-sort the songs into the playlist's own order.
  const songs = await Song.find({ _id: { $in: playlist.songs } }).populate(SONG_POPULATE);
  const byId = new Map(songs.map((s) => [String(s._id), s]));
  const ordered = playlist.songs.map((id) => byId.get(String(id))).filter(Boolean);

  const data = playlist.toJSON();
  data.songs = ordered;
  data.owner = { id: req.user.id, name: req.user.name };
  sendSuccess(res, { data });
});

export const createPlaylist = asyncHandler(async (req, res) => {
  const count = await Playlist.countDocuments({ owner: req.user._id });
  const playlist = await Playlist.create({
    name: req.body.name || `My Playlist #${count + 1}`,
    description: req.body.description,
    owner: req.user._id,
  });
  sendSuccess(res, { statusCode: 201, message: "Playlist created", data: toListItem(playlist, new Map()) });
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const playlist = await findOwned(req.params.id, req.user._id);
  Object.assign(playlist, req.body);
  await playlist.save();
  sendSuccess(res, {
    message: "Playlist updated",
    data: { id: playlist.id, name: playlist.name, description: playlist.description, updatedAt: playlist.updatedAt },
  });
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const result = await Playlist.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (result.deletedCount === 0) throw ApiError.notFound("Playlist not found");
  sendSuccess(res, { message: "Playlist deleted" });
});

export const addSongToPlaylist = asyncHandler(async (req, res) => {
  const { songId } = req.body;
  if (!(await Song.exists({ _id: songId }))) throw ApiError.notFound("Song not found");

  // `songs: { $ne: songId }` makes the push atomic and duplicate-proof, even with double clicks.
  const result = await Playlist.updateOne(
    { _id: req.params.id, owner: req.user._id, songs: { $ne: songId } },
    { $push: { songs: songId } }
  );

  if (result.matchedCount === 0) {
    const exists = await Playlist.exists({ _id: req.params.id, owner: req.user._id });
    throw exists ? ApiError.conflict("This song is already in the playlist") : ApiError.notFound("Playlist not found");
  }
  sendSuccess(res, { message: "Added to playlist" });
});

export const removeSongFromPlaylist = asyncHandler(async (req, res) => {
  const result = await Playlist.updateOne(
    { _id: req.params.id, owner: req.user._id },
    { $pull: { songs: req.params.songId } }
  );
  if (result.matchedCount === 0) throw ApiError.notFound("Playlist not found");
  sendSuccess(res, { message: "Removed from playlist" });
});
