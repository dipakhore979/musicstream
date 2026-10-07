import { Router } from "express";
import {
  addSongToPlaylist, createPlaylist, deletePlaylist, getPlaylist,
  listPlaylists, removeSongFromPlaylist, updatePlaylist,
} from "../controllers/playlist.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addSongSchema, createPlaylistSchema, listQuery, playlistIdParam, playlistSongParam, updatePlaylistSchema,
} from "../validators/playlist.schemas.js";

const router = Router();
router.use(protect);

router.get("/", validate(listQuery, "query"), listPlaylists);
router.post("/", validate(createPlaylistSchema), createPlaylist);
router.get("/:id", validate(playlistIdParam, "params"), getPlaylist);
router.patch("/:id", validate(playlistIdParam, "params"), validate(updatePlaylistSchema), updatePlaylist);
router.delete("/:id", validate(playlistIdParam, "params"), deletePlaylist);

router.post("/:id/songs", validate(playlistIdParam, "params"), validate(addSongSchema), addSongToPlaylist);
router.delete("/:id/songs/:songId", validate(playlistSongParam, "params"), removeSongFromPlaylist);

export default router;
