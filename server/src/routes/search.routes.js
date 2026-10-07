import { Router } from "express";
import { listGenres, search } from "../controllers/search.controller.js";
import { protect } from "../middleware/auth.js";
import { searchLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { searchQuery } from "../validators/search.schemas.js";

const router = Router();
router.use(protect);

router.get("/", searchLimiter, validate(searchQuery, "query"), search);
router.get("/genres", listGenres);

export default router;
