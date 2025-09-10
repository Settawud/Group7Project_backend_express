import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { User } from "../../../models/User.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../../config/cloudinary.js";
import { me, updateMe, changePassword } from "./controllers/user.controller.js";

const router = express.Router();
// All user routes below require auth
router.use(jwtBearer);

function requireCloudinaryConfigured(_req, res, next) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env || {};
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(503).json({
      error: true,
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and restart the server.",
    });
  }
  next();
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "users",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = /image\/(jpe?g|png|webp)/i.test(file.mimetype || "");
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.originalname || "");
    const ok = mimeOk || extOk;
    if (!ok) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

// PATCH /api/v1/mongo/users/me/image
router.patch(
  "/me/image",
  requireCloudinaryConfigured,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const f = req.file || {};
      const url = f.path || f.secure_url || "";
      if (!url) return res.status(400).json({ error: true, message: "No image uploaded" });

      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { $set: { image: url } },
        { new: true, runValidators: true }
      );
      if (!user) return res.status(404).json({ error: true, message: "User not found" });
      return res.json({ success: true, user });
    } catch (err) {
      if (err?.message === "Invalid file type") {
        return res.status(400).json({ error: true, message: "Only JPG/PNG/WebP images are allowed" });
      }
      next(err);
    }
  }
);

// Current user profile routes
router.get("/me", me);
router.patch("/me", updateMe);
router.patch("/me/password", changePassword);

export default router;
