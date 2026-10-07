import { Router } from "express";
import { removeAvatar, updateMe } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { uploadImageField } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/user.schemas.js";

const router = Router();
router.use(protect);

// Multer runs before validate so the multipart "name" field is available in req.body.
router.patch("/me", uploadLimiter, ...uploadImageField("avatar"), validate(updateProfileSchema), updateMe);
router.delete("/me/avatar", removeAvatar);

export default router;
