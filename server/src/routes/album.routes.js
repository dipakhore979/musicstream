import { Router } from "express";
import { createAlbum, deleteAlbum, getAlbum, listAlbums, updateAlbum } from "../controllers/album.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { uploadImageField } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createAlbumSchema, idParamSchema, listAlbumsQuery, updateAlbumSchema } from "../validators/music.schemas.js";

const router = Router();
router.use(protect);

router.get("/", validate(listAlbumsQuery, "query"), listAlbums);
router.get("/:id", validate(idParamSchema, "params"), getAlbum);

router.post("/", restrictTo("admin"), uploadLimiter, ...uploadImageField("cover"), validate(createAlbumSchema), createAlbum);
router.patch(
  "/:id",
  restrictTo("admin"),
  validate(idParamSchema, "params"),
  ...uploadImageField("cover"),
  validate(updateAlbumSchema),
  updateAlbum
);
router.delete("/:id", restrictTo("admin"), validate(idParamSchema, "params"), deleteAlbum);

export default router;
