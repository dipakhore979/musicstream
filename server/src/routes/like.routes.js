import { Router } from "express";
import { getLikedIds, likeSong, listLikedSongs, unlikeSong } from "../controllers/like.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listQuery, songIdParam } from "../validators/playlist.schemas.js";

const router = Router();
router.use(protect);

router.get("/", validate(listQuery, "query"), listLikedSongs);
router.get("/ids", getLikedIds); // must stay above "/:songId"
router.put("/:songId", validate(songIdParam, "params"), likeSong);
router.delete("/:songId", validate(songIdParam, "params"), unlikeSong);

export default router;
