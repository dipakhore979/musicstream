// What the client needs to render a song row: artist name/link and album title/cover fallback.
export const SONG_POPULATE = [
  { path: "artist", select: "name image" },
  { path: "album", select: "title coverImage" },
];

export const ALBUM_POPULATE = [{ path: "artist", select: "name image" }];
