import { Router } from "express";
import {
  createSong, deleteSong, getSong, listSongs, registerPlay, updateSong,
} from "../controllers/song.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { playLimiter, uploadLimiter } from "../middleware/rateLimiters.js";
import { uploadImageField, uploadSongFiles } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createSongSchema, idParamSchema, listSongsQuery, updateSongSchema } from "../validators/music.schemas.js";

const router = Router();
router.use(protect);

router.get("/", validate(listSongsQuery, "query"), listSongs);
router.get("/:id", validate(idParamSchema, "params"), getSong);
router.post("/:id/play", playLimiter, validate(idParamSchema, "params"), registerPlay);

router.post("/", restrictTo("admin"), uploadLimiter, ...uploadSongFiles, validate(createSongSchema), createSong);
router.patch(
  "/:id",
  restrictTo("admin"),
  validate(idParamSchema, "params"),
  ...uploadImageField("cover"),
  validate(updateSongSchema),
  updateSong
);
router.delete("/:id", restrictTo("admin"), validate(idParamSchema, "params"), deleteSong);

export default router;
