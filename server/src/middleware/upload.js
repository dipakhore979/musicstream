import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MB = 1024 * 1024;
const MAX_AUDIO = 30 * MB;
const MAX_IMAGE = 5 * MB;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
  "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/flac", "audio/webm",
];

// Files are kept in memory and streamed straight to Cloudinary, so nothing touches the server disk.
// (Render's disk is ephemeral anyway.)
const base = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO, files: 2 },
  fileFilter(_req, file, cb) {
    const allowed = file.fieldname === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const expected = file.fieldname === "audio" ? "an audio file (mp3, wav, ogg, m4a, flac)" : "an image (jpg, png, webp)";
    cb(ApiError.badRequest(`"${file.fieldname}" must be ${expected}`));
  },
});

// Multer has one size limit for everything, so images get a tighter check afterwards.
function checkImageSizes(req, _res, next) {
  const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
  const tooBig = files.find((f) => f.fieldname !== "audio" && f.size > MAX_IMAGE);
  if (tooBig) return next(ApiError.badRequest(`"${tooBig.fieldname}" image must be under 5 MB`));
  next();
}

// Usage: router.post("/", ...uploadImageField("cover"), validate(schema), handler)
export const uploadImageField = (name) => [base.single(name), checkImageSizes];
export const uploadSongFiles = [
  base.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  checkImageSizes,
];
