import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const playlistIdParam = z.object({ id: objectId });
export const playlistSongParam = z.object({ id: objectId, songId: objectId });
export const songIdParam = z.object({ songId: objectId });

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Name is optional on create: the server then picks "My Playlist #N", like Spotify.
export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(100).optional(),
  description: z.string().trim().max(300).optional(),
});
export const updatePlaylistSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(100).optional(),
  description: z.string().trim().max(300).optional(),
});
export const addSongSchema = z.object({ songId: objectId });
