import { Router } from "express";
import { createArtist, deleteArtist, getArtist, listArtists, updateArtist } from "../controllers/artist.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { uploadImageField } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createArtistSchema, idParamSchema, listArtistsQuery, updateArtistSchema } from "../validators/music.schemas.js";

const router = Router();
router.use(protect);

router.get("/", validate(listArtistsQuery, "query"), listArtists);
router.get("/:id", validate(idParamSchema, "params"), getArtist);

// Write routes: admin only. Multer runs before validate so multipart text fields are in req.body.
router.post("/", restrictTo("admin"), uploadLimiter, ...uploadImageField("image"), validate(createArtistSchema), createArtist);
router.patch(
  "/:id",
  restrictTo("admin"),
  validate(idParamSchema, "params"),
  ...uploadImageField("image"),
  validate(updateArtistSchema),
  updateArtist
);
router.delete("/:id", restrictTo("admin"), validate(idParamSchema, "params"), deleteArtist);

export default router;
