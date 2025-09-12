import express from "express"; 
// ใช้ Express.js สำหรับสร้าง Router และกำหนดเส้นทาง API

import jwtBearer from "../../../middleware/jwtBearer.js"; 
// Middleware ตรวจสอบ JWT token ว่าผู้ใช้ล็อกอินแล้ว

import { User } from "../../../models/User.js"; 
// ดึง Mongoose model ของ User เพื่อใช้ CRUD database

import multer from "multer"; 
// ใช้ multer สำหรับจัดการ multipart/form-data (อัพโหลดไฟล์)

import { CloudinaryStorage } from "multer-storage-cloudinary"; 
// ใช้ storage adapter สำหรับอัพโหลดไฟล์ตรงไปยัง Cloudinary

import cloudinary from "../../../config/cloudinary.js"; 
// โหลด instance ของ Cloudinary ที่ config ไว้แล้ว

import { me, updateMe, changePassword } from "./controllers/user.controller.js"; 
// import controller ที่เกี่ยวข้องกับโปรไฟล์ user (ดูข้อมูล, อัปเดต, เปลี่ยนรหัสผ่าน)

const router = express.Router(); 
// สร้าง Router object เพื่อแยก route ของ user ออกมา

// --- Middleware บังคับว่าทุก route ของ user ต้องผ่าน JWT ---
router.use(jwtBearer); 
// ทุก request ต้องมี token valid ก่อนถึงเข้ามาได้

// ฟังก์ชันตรวจสอบว่ามี config Cloudinary อยู่จริง ๆ หรือยัง
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

// กำหนด storage ของ multer ให้ใช้ Cloudinary โดยตรง
const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "users",                          // จัดเก็บไฟล์ไว้ในโฟลเดอร์ users
    resource_type: "image",                   // อัพโหลดประเภท image
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // จำกัดนามสกุล
    transformation: [{ quality: "auto", fetch_format: "auto" }], // ให้ Cloudinary optimize อัตโนมัติ
  }),
});

// ตั้งค่า multer (upload middleware)
const upload = multer({
  storage,                                    // ใช้ storage ที่ผูกกับ Cloudinary
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // จำกัดไฟล์สูงสุด 5MB และ 1 ไฟล์
  fileFilter: (_req, file, cb) => {           // ตรวจสอบ mimetype และนามสกุลไฟล์
    const mimeOk = /image\/(jpe?g|png|webp)/i.test(file.mimetype || "");
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.originalname || "");
    const ok = mimeOk || extOk;
    if (!ok) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

// --------- PATCH /me/image (อัปโหลด/เปลี่ยนรูปโปรไฟล์) ----------
router.patch(
  "/me/image",
  requireCloudinaryConfigured,   // เช็คว่ามี config cloudinary ก่อน
  upload.single("image"),        // ใช้ multer รับไฟล์เดียวจากฟิลด์ชื่อ image
  async (req, res, next) => {
    try {
      const f = req.file || {};
      const url = f.path || f.secure_url || "";    // เอา URL ไฟล์ที่อัพโหลด
      if (!url) return res.status(400).json({ error: true, message: "No image uploaded" });

      // update image field ของ user
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

// --------- DELETE /me/image (ลบรูปโปรไฟล์) ----------
router.delete("/me/image", async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: true, message: "User not found" });

    const url = user.image || "";
    user.image = "";             // clear ค่า image ใน DB
    await user.save();

    // ฟังก์ชันช่วย extract publicId ของไฟล์จาก Cloudinary URL
    const tryExtractPublicId = (u) => {
      try {
        if (!u) return "";
        const withoutProtocol = u.replace(/^https?:\/\//i, "");
        if (!/res\.cloudinary\.com|cloudinary/.test(withoutProtocol)) return "";
        const idx = withoutProtocol.indexOf("/upload/");
        if (idx === -1) return "";
        let rest = withoutProtocol.slice(idx + 8);
        rest = rest.split("?")[0];             // ตัด query string
        rest = rest.replace(/\/v\d+\//, "/");  // ลบเวอร์ชัน v12345
        rest = rest.replace(/\.[a-zA-Z0-9]+$/, ""); // ลบนามสกุลไฟล์
        return rest.trim();
      } catch {
        return "";
      }
    };

    const publicId = tryExtractPublicId(url);
    if (publicId) {
      try { 
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); 
      } catch {} // best-effort ลบ ไม่ error ก็ปล่อยผ่าน
    }

    return res.json({ success: true });
  } catch (err) { next(err); }
});

// --------- Routes ดู/แก้ไขโปรไฟล์ และเปลี่ยนรหัส ---------
router.get("/me", me);                  // ดึงข้อมูล user ปัจจุบัน
router.patch("/me", updateMe);          // อัปเดตข้อมูล user
router.patch("/me/password", changePassword); // เปลี่ยนรหัสผ่าน

export default router; 
// export router ออกไปใช้ใน main app
