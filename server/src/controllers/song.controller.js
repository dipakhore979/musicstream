import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Like from "../models/Like.js";
import Playlist from "../models/Playlist.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildPageMeta, getPagination, sendSuccess } from "../utils/apiResponse.js";
import { deleteAsset, uploadAudio, uploadImage } from "../utils/cloudinaryUpload.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { SONG_POPULATE } from "../utils/populate.js";

const SORTS = {
  newest: { createdAt: -1 },
  popular: { playCount: -1, createdAt: -1 },
  title: { title: 1 },
};

async function assertRefsExist({ artist, album }) {
  if (artist && !(await Artist.exists({ _id: artist }))) throw ApiError.badRequest("Selected artist does not exist");
  if (album && !(await Album.exists({ _id: album }))) throw ApiError.badRequest("Selected album does not exist");
}

export const listSongs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, artist, album, genre, sort } = req.query;

  const filter = {};
  if (search) filter.title = new RegExp(escapeRegex(search), "i");
  if (artist) filter.artist = artist;
  if (album) filter.album = album;
  if (genre) filter.genre = new RegExp(`^${escapeRegex(genre)}$`, "i");

  const [items, total] = await Promise.all([
    Song.find(filter).sort(SORTS[sort]).skip(skip).limit(limit).populate(SONG_POPULATE),
    Song.countDocuments(filter),
  ]);
  sendSuccess(res, { data: items, meta: buildPageMeta({ page, limit, total }) });
});

export const getSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id).populate(SONG_POPULATE);
  if (!song) throw ApiError.notFound("Song not found");
  sendSuccess(res, { data: song });
});

export const createSong = asyncHandler(async (req, res) => {
  const audioFile = req.files?.audio?.[0];
  const coverFile = req.files?.cover?.[0];
  if (!audioFile) throw ApiError.badRequest("An audio file is required");

  const { title, artist, album, genre, trackNumber, downloadable } = req.body;
  await assertRefsExist({ artist, album });

  const uploaded = []; // tracked so we can roll back if anything below fails
  try {
    const audio = await uploadAudio(audioFile);
    uploaded.push({ publicId: audio.publicId, type: "video" });

    let coverImage;
    if (coverFile) {
      coverImage = await uploadImage(coverFile, "covers");
      uploaded.push({ publicId: coverImage.publicId, type: "image" });
    }

    const song = await Song.create({
      title,
      artist,
      album: album || null,
      genre,
      trackNumber,
      ...(downloadable !== undefined && { downloadable }),
      duration: audio.duration,
      audio: { url: audio.url, publicId: audio.publicId },
      ...(coverImage && { coverImage }),
    });
    await song.populate(SONG_POPULATE);
    sendSuccess(res, { statusCode: 201, message: "Song uploaded", data: song });
  } catch (err) {
    await Promise.all(uploaded.map((u) => deleteAsset(u.publicId, u.type)));
    throw err;
  }
});

export const updateSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound("Song not found");
  await assertRefsExist(req.body);

  let newCover;
  const oldPublicId = song.coverImage?.publicId;
  try {
    if (req.file) {
      newCover = await uploadImage(req.file, "covers");
      song.coverImage = newCover;
    }
    Object.assign(song, req.body);
    await song.save();
  } catch (err) {
    if (newCover) await deleteAsset(newCover.publicId);
    throw err;
  }
  if (newCover && oldPublicId) await deleteAsset(oldPublicId);

  await song.populate(SONG_POPULATE);
  sendSuccess(res, { message: "Song updated", data: song });
});

export const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound("Song not found");

  await song.deleteOne();
  // Remove dangling references so no like or playlist points at a song that no longer exists.
  await Promise.all([
    Like.deleteMany({ song: song._id }),
    Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } }),
  ]);
  await Promise.all([
    deleteAsset(song.audio?.publicId, "video"),
    deleteAsset(song.coverImage?.publicId, "image"),
  ]);
  sendSuccess(res, { message: "Song deleted" });
});

// Called by the player (Phase 4) when a track starts playing.
export const registerPlay = asyncHandler(async (req, res) => {
  const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } });
  if (!song) throw ApiError.notFound("Song not found");
  sendSuccess(res, { message: "Play recorded" });
});

// Returns a link that makes the browser SAVE the file instead of playing it. Cloudinary's
// `fl_attachment:<name>` flag sets the download header and the file name.
export const getDownloadLink = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id).populate({ path: "artist", select: "name" });
  if (!song) throw ApiError.notFound("Song not found");
  if (song.downloadable === false) throw ApiError.forbidden("Downloads are turned off for this song");

  const label = `${song.artist?.name ? `${song.artist.name} - ` : ""}${song.title}`;
  // Cloudinary only accepts letters, numbers, dashes and underscores in this name.
  const safeName = label.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "song";
  const extension = song.audio.url.split("?")[0].split(".").pop() || "mp3";

  sendSuccess(res, {
    data: {
      url: song.audio.url.replace("/upload/", `/upload/fl_attachment:${safeName}/`),
      filename: `${safeName}.${extension}`,
    },
  });
});
