// Fills the database (and Cloudinary) with demo content from a JSON file.
//
//   cd server
//   npm run seed                       # reads seed/tracks.json
//   npm run seed -- seed/tracks.example.json
//
// Safe to run repeatedly: artists, albums and songs that already exist are skipped.
// Each "audio", "cover" or "image" value is either an http(s) URL or a file path relative to /server/seed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import cloudinary, { isCloudinaryConfigured } from "../src/config/cloudinary.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import Artist from "../src/models/Artist.js";
import Album from "../src/models/Album.js";
import Song from "../src/models/Song.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(here, "..", "seed");
const fileArg = path.resolve(process.argv[2] || path.join(seedDir, "tracks.json"));

const source = z.string().min(1).optional();
const schema = z.object({
  artists: z.array(z.object({ name: z.string().min(1), bio: z.string().optional(), image: source })).default([]),
  albums: z
    .array(
      z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        releaseYear: z.number().int().optional(),
        description: z.string().optional(),
        cover: source,
      })
    )
    .default([]),
  songs: z
    .array(
      z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        album: z.string().optional(),
        genre: z.string().optional(),
        trackNumber: z.number().int().optional(),
        audio: z.string().min(1),
        cover: source,
      })
    )
    .min(1),
});

const isUrl = (value) => /^https?:\/\//i.test(value);

function resolveSource(value) {
  if (isUrl(value)) return value;
  const full = path.resolve(seedDir, value);
  if (!fs.existsSync(full)) throw new Error(`File not found: ${full}`);
  return full;
}

async function uploadImage(value, folder) {
  const r = await cloudinary.uploader.upload(resolveSource(value), {
    folder: `musicstream/${folder}`,
    resource_type: "image",
    transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto" }],
  });
  return { url: r.secure_url, publicId: r.public_id };
}

async function uploadAudio(value) {
  // Cloudinary stores audio under the "video" resource type.
  const r = await cloudinary.uploader.upload(resolveSource(value), {
    folder: "musicstream/songs",
    resource_type: "video",
  });
  return { url: r.secure_url, publicId: r.public_id, duration: Math.round(r.duration || 0) };
}

const stats = { artists: 0, albums: 0, songs: 0, skipped: 0, failed: [] };
const artistCache = new Map();
const albumCache = new Map();

async function findArtist(name) {
  const key = name.toLowerCase();
  if (!artistCache.has(key)) {
    const doc = await Artist.findOne({ name }).collation({ locale: "en", strength: 2 });
    if (doc) artistCache.set(key, doc);
  }
  return artistCache.get(key) ?? null;
}

async function seedArtist(def) {
  if (await findArtist(def.name)) {
    stats.skipped++;
    return;
  }
  const doc = await Artist.create({
    name: def.name,
    bio: def.bio ?? "",
    ...(def.image && { image: await uploadImage(def.image, "artists") }),
  });
  artistCache.set(def.name.toLowerCase(), doc);
  stats.artists++;
  console.log(`  + artist  ${def.name}`);
}

async function seedAlbum(def) {
  const artist = await findArtist(def.artist);
  if (!artist) throw new Error(`Artist "${def.artist}" not found`);

  const key = `${artist.id}|${def.title.toLowerCase()}`;
  let doc = albumCache.get(key) ?? (await Album.findOne({ title: def.title, artist: artist._id }));
  if (doc) {
    albumCache.set(key, doc);
    stats.skipped++;
    return;
  }
  doc = await Album.create({
    title: def.title,
    artist: artist._id,
    releaseYear: def.releaseYear,
    description: def.description ?? "",
    ...(def.cover && { coverImage: await uploadImage(def.cover, "albums") }),
  });
  albumCache.set(key, doc);
  stats.albums++;
  console.log(`  + album   ${def.title}`);
}

async function seedSong(def) {
  const artist = await findArtist(def.artist);
  if (!artist) throw new Error(`Artist "${def.artist}" not found`);

  if (await Song.exists({ title: def.title, artist: artist._id })) {
    stats.skipped++;
    return;
  }

  let albumId = null;
  if (def.album) {
    const album = await Album.findOne({ title: def.album, artist: artist._id });
    if (!album) throw new Error(`Album "${def.album}" not found for ${def.artist}`);
    albumId = album._id;
  }

  const audio = await uploadAudio(def.audio);
  await Song.create({
    title: def.title,
    artist: artist._id,
    album: albumId,
    genre: def.genre ?? "",
    trackNumber: def.trackNumber ?? null,
    duration: audio.duration,
    audio: { url: audio.url, publicId: audio.publicId },
    ...(def.cover && { coverImage: await uploadImage(def.cover, "covers") }),
  });
  stats.songs++;
  console.log(`  + song    ${def.title} (${audio.duration}s)`);
}

// One bad entry shouldn't stop the rest: log it and carry on.
async function step(label, fn) {
  try {
    await fn();
  } catch (err) {
    stats.failed.push(`${label}: ${err.message}`);
    console.error(`  ! ${label}: ${err.message}`);
  }
}

async function main() {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* in server/.env first.");
  }
  if (!fs.existsSync(fileArg)) {
    throw new Error(
      `No seed file at ${fileArg}\n` +
        "  Copy server/seed/tracks.example.json to server/seed/tracks.json and edit it,\n" +
        "  or pass a path:  npm run seed -- seed/tracks.example.json"
    );
  }

  const parsed = schema.safeParse(JSON.parse(fs.readFileSync(fileArg, "utf8")));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid seed file:\n${issues}`);
  }
  const data = parsed.data;

  await connectDB();
  console.log(`Seeding from ${fileArg}`);

  for (const a of data.artists) await step(`artist ${a.name}`, () => seedArtist(a));
  for (const a of data.albums) await step(`album ${a.title}`, () => seedAlbum(a));
  for (const s of data.songs) await step(`song ${s.title}`, () => seedSong(s));

  console.log(
    `\nDone: ${stats.artists} artists, ${stats.albums} albums, ${stats.songs} songs created; ${stats.skipped} already existed.`
  );
  if (stats.failed.length) {
    console.log(`${stats.failed.length} item(s) failed:`);
    stats.failed.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB().catch(() => {});
}
