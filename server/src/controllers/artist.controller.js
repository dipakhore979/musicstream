import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Song from "../models/Song.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildPageMeta, getPagination, sendSuccess } from "../utils/apiResponse.js";
import { deleteAsset, uploadImage } from "../utils/cloudinaryUpload.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { ALBUM_POPULATE, SONG_POPULATE } from "../utils/populate.js";

export const listArtists = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.search ? { name: new RegExp(escapeRegex(req.query.search), "i") } : {};

  const [items, total] = await Promise.all([
    Artist.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Artist.countDocuments(filter),
  ]);
  sendSuccess(res, { data: items, meta: buildPageMeta({ page, limit, total }) });
});

export const getArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) throw ApiError.notFound("Artist not found");

  const [topSongs, albums] = await Promise.all([
    Song.find({ artist: artist._id }).sort({ playCount: -1, createdAt: -1 }).limit(10).populate(SONG_POPULATE),
    Album.find({ artist: artist._id }).sort({ releaseYear: -1, createdAt: -1 }).populate(ALBUM_POPULATE),
  ]);

  const data = artist.toJSON();
  data.topSongs = topSongs;
  data.albums = albums;
  sendSuccess(res, { data });
});

export const createArtist = asyncHandler(async (req, res) => {
  let image;
  try {
    if (req.file) image = await uploadImage(req.file, "artists");
    const artist = await Artist.create({ ...req.body, ...(image && { image }) });
    sendSuccess(res, { statusCode: 201, message: "Artist created", data: artist });
  } catch (err) {
    // Don't leave an orphaned file in Cloudinary if the DB write failed (e.g. duplicate name).
    if (image) await deleteAsset(image.publicId);
    throw err;
  }
});

export const updateArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) throw ApiError.notFound("Artist not found");

  let newImage;
  const oldPublicId = artist.image?.publicId;
  try {
    if (req.file) {
      newImage = await uploadImage(req.file, "artists");
      artist.image = newImage;
    }
    Object.assign(artist, req.body);
    await artist.save();
  } catch (err) {
    if (newImage) await deleteAsset(newImage.publicId);
    throw err;
  }
  if (newImage && oldPublicId) await deleteAsset(oldPublicId);

  sendSuccess(res, { message: "Artist updated", data: artist });
});

export const deleteArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) throw ApiError.notFound("Artist not found");

  // Deleting an artist with content would orphan songs/albums, so make the admin remove those first.
  const [hasSongs, hasAlbums] = await Promise.all([
    Song.exists({ artist: artist._id }),
    Album.exists({ artist: artist._id }),
  ]);
  if (hasSongs || hasAlbums) {
    throw ApiError.conflict("This artist still has songs or albums. Delete those first.");
  }

  await artist.deleteOne();
  await deleteAsset(artist.image?.publicId);
  sendSuccess(res, { message: "Artist deleted" });
});
