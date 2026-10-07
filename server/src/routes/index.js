import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import artistRoutes from "./artist.routes.js";
import albumRoutes from "./album.routes.js";
import songRoutes from "./song.routes.js";
import playlistRoutes from "./playlist.routes.js";
import likeRoutes from "./like.routes.js";
import searchRoutes from "./search.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/artists", artistRoutes);
router.use("/albums", albumRoutes);
router.use("/songs", songRoutes);
router.use("/playlists", playlistRoutes);
router.use("/likes", likeRoutes);
router.use("/search", searchRoutes);
router.use("/users", userRoutes);

export default router;
