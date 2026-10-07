import Album from "../models/Album.js";
import Artist from "../models/Artist.js";
import Song from "../models/Song.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildPageMeta, getPagination, sendSuccess } from "../utils/apiResponse.js";
import { deleteAsset, uploadImage } from "../utils/cloudinaryUpload.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { ALBUM_POPULATE, SONG_POPULATE } from "../utils/populate.js";

async function assertArtistExists(id) {
  if (!(await Artist.exists({ _id: id }))) throw ApiError.badRequest("Selected artist does not exist");
}

export const listAlbums = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, artist } = req.query;

  const filter = {};
  if (search) filter.title = new RegExp(escapeRegex(search), "i");
  if (artist) filter.artist = artist;

  const [items, total] = await Promise.all([
    Album.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(ALBUM_POPULATE),
    Album.countDocuments(filter),
  ]);
  sendSuccess(res, { data: items, meta: buildPageMeta({ page, limit, total }) });
});

export const getAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate(ALBUM_POPULATE);
  if (!album) throw ApiError.notFound("Album not found");

  const songs = await Song.find({ album: album._id })
    .sort({ trackNumber: 1, createdAt: 1 })
    .populate(SONG_POPULATE);

  const data = album.toJSON();
  data.songs = songs;
  sendSuccess(res, { data });
});

export const createAlbum = asyncHandler(async (req, res) => {
  await assertArtistExists(req.body.artist);

  let cover;
  try {
    if (req.file) cover = await uploadImage(req.file, "albums");
    const album = await Album.create({ ...req.body, ...(cover && { coverImage: cover }) });
    await album.populate(ALBUM_POPULATE);
    sendSuccess(res, { statusCode: 201, message: "Album created", data: album });
  } catch (err) {
    if (cover) await deleteAsset(cover.publicId);
    throw err;
  }
});

export const updateAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) throw ApiError.notFound("Album not found");
  if (req.body.artist) await assertArtistExists(req.body.artist);

  let newCover;
  const oldPublicId = album.coverImage?.publicId;
  try {
    if (req.file) {
      newCover = await uploadImage(req.file, "albums");
      album.coverImage = newCover;
    }
    Object.assign(album, req.body);
    await album.save();
  } catch (err) {
    if (newCover) await deleteAsset(newCover.publicId);
    throw err;
  }
  if (newCover && oldPublicId) await deleteAsset(oldPublicId);

  await album.populate(ALBUM_POPULATE);
  sendSuccess(res, { message: "Album updated", data: album });
});

export const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) throw ApiError.notFound("Album not found");

  // Songs survive as singles instead of being deleted along with the album.
  await Song.updateMany({ album: album._id }, { $set: { album: null } });
  await album.deleteOne();
  await deleteAsset(album.coverImage?.publicId);
  sendSuccess(res, { message: "Album deleted" });
});
