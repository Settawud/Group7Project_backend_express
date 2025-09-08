import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { initDB, listColors, getColor, createColor, updateColor, deleteColor } from "../../../utils/db.js";

const router = express.Router();

initDB();

// GET /api/v1/colors
router.get("/", (_req, res) => {
  const items = listColors();
  res.json({ success: true, count: items.length, items });
});

// GET /api/v1/colors/:colorId
router.get("/:colorId", (req, res) => {
  const item = getColor(req.params.colorId);
  if (!item) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true, item });
});

// POST /api/v1/colors (auth required)
router.post("/", jwtBearer, (req, res) => {
  const { name_th, name_en, hex } = req.body || {};
  if (!name_th || !name_en || !hex) {
    return res.status(400).json({ error: true, message: "name_th, name_en, hex required" });
  }
  const created = createColor({ name_th, name_en, hex });
  res.status(201).json({ success: true, item: created });
});

// PATCH /api/v1/colors/:colorId (auth required)
router.patch("/:colorId", jwtBearer, (req, res) => {
  const updated = updateColor(req.params.colorId, req.body || {});
  if (!updated) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true, item: updated });
});

// DELETE /api/v1/colors/:colorId (auth required)
router.delete("/:colorId", jwtBearer, (req, res) => {
  const ok = deleteColor(req.params.colorId);
  if (!ok) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true });
});

export default router;

