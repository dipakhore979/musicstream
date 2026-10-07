import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// Multipart form fields arrive as strings, and empty inputs arrive as "". These helpers handle both.
const emptyToUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalObjectId = z.preprocess(emptyToUndefined, objectId.optional());
const nullableObjectId = z.preprocess((v) => (v === "" ? null : v), objectId.nullable().optional());
const optionalInt = (min, max) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max).optional());

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
const search = z.string().trim().max(100).optional();

export const idParamSchema = z.object({ id: objectId });

// ---- Artists
export const listArtistsQuery = z.object({ ...pagination, search });
export const createArtistSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1, "Name is required").max(100),
  bio: z.string().trim().max(2000).optional(),
});
export const updateArtistSchema = createArtistSchema.partial();

// ---- Albums
export const listAlbumsQuery = z.object({ ...pagination, search, artist: optionalObjectId });
export const createAlbumSchema = z.object({
  title: z.string({ required_error: "Title is required" }).trim().min(1, "Title is required").max(150),
  artist: objectId,
  releaseYear: optionalInt(1900, new Date().getFullYear() + 1),
  description: z.string().trim().max(2000).optional(),
});
export const updateAlbumSchema = createAlbumSchema.partial();

// ---- Songs
export const listSongsQuery = z.object({
  ...pagination,
  search,
  artist: optionalObjectId,
  album: optionalObjectId,
  genre: z.string().trim().max(50).optional(),
  sort: z.enum(["newest", "popular", "title"]).default("newest"),
});
export const createSongSchema = z.object({
  title: z.string({ required_error: "Title is required" }).trim().min(1, "Title is required").max(150),
  artist: objectId,
  album: optionalObjectId,
  genre: z.string().trim().max(50).optional(),
  trackNumber: optionalInt(1, 999),
});
export const updateSongSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  artist: objectId.optional(),
  album: nullableObjectId, // "" clears the album
  genre: z.string().trim().max(50).optional(),
  trackNumber: optionalInt(1, 999),
});
