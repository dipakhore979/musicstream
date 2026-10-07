import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Song from "../models/Song.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { ALBUM_POPULATE, SONG_POPULATE } from "../utils/populate.js";

// How well does `text` match the query? Exact beats prefix beats word-start beats "contains".
function score(text = "", query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 70;
  if (t.split(/\s+/).some((word) => word.startsWith(q))) return 50;
  if (t.includes(q)) return 30;
  return 0;
}

// Sorting is stable, so ties keep their incoming order (songs arrive sorted by popularity).
const rankBy = (items, textOf, q) =>
  items
    .map((item) => ({ item, s: score(textOf(item), q) }))
    .sort((a, b) => b.s - a.s || textOf(a.item).localeCompare(textOf(b.item)));

export const search = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  // Escaping makes user input literal text, so "c++" or "(" can't break or abuse the regex.
  const rx = new RegExp(escapeRegex(q), "i");

  // Searching an artist's name should also surface their albums and songs, so look in three steps.
  const matchedArtists = await Artist.find({ name: rx }).limit(30);
  const artistIds = matchedArtists.map((a) => a._id);

  const matchedAlbums = await Album.find({ $or: [{ title: rx }, { artist: { $in: artistIds } }] })
    .limit(40)
    .populate(ALBUM_POPULATE);
  const albumIds = matchedAlbums.map((a) => a._id);

  const matchedSongs = await Song.find({
    $or: [{ title: rx }, { genre: rx }, { artist: { $in: artistIds } }, { album: { $in: albumIds } }],
  })
    .sort({ playCount: -1 })
    .limit(60)
    .populate(SONG_POPULATE);

  const artists = rankBy(matchedArtists, (a) => a.name, q);
  const albums = rankBy(matchedAlbums, (a) => a.title, q);
  const songs = rankBy(matchedSongs, (s) => s.title, q);

  // Top result: best score across all three types, with a small bonus so artists/albums win ties.
  const candidates = [
    ...artists.slice(0, 1).map((r) => ({ type: "artist", item: r.item, s: r.s + 5 })),
    ...albums.slice(0, 1).map((r) => ({ type: "album", item: r.item, s: r.s + 3 })),
    ...songs.slice(0, 1).map((r) => ({ type: "song", item: r.item, s: r.s })),
  ].filter((c) => c.s > 5 || (c.type === "song" && c.s > 0));
  const best = candidates.sort((a, b) => b.s - a.s)[0];

  sendSuccess(res, {
    data: {
      query: q,
      topResult: best ? { type: best.type, item: best.item } : null,
      artists: artists.slice(0, limit).map((r) => r.item),
      albums: albums.slice(0, limit).map((r) => r.item),
      songs: songs.slice(0, limit).map((r) => r.item),
    },
  });
});

// Genres that actually exist in the library, most common first (powers the "Browse all" tiles).
export const listGenres = asyncHandler(async (_req, res) => {
  const genres = await Song.aggregate([
    { $match: { genre: { $ne: "" } } },
    { $group: { _id: { $toLower: "$genre" }, name: { $first: "$genre" }, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 24 },
    { $project: { _id: 0, name: 1, count: 1 } },
  ]);
  sendSuccess(res, { data: genres });
});
