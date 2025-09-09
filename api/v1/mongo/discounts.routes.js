import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { userDiscounts as UserDiscount } from "../../../models/Discounts.js";

const router = express.Router();

router.use(jwtBearer);

// GET /api/v1/mongo/discounts
router.get("/", async (req, res, next) => {
  try {
    const items = await UserDiscount.find({ user_id: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) { next(err); }
});

// POST /api/v1/mongo/discounts
router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const required = ["code", "type", "value", "startDate", "endDate"];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === "") {
        return res.status(400).json({ error: true, message: `${k} required` });
      }
    }
    if (!["percentage", "fixed"].includes(body.type)) {
      return res.status(400).json({ error: true, message: "type must be 'percentage' or 'fixed'" });
    }
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return res.status(400).json({ error: true, message: "startDate/endDate invalid" });
    }
    if (end < start) return res.status(400).json({ error: true, message: "endDate must be after startDate" });

    try {
      const created = await UserDiscount.create({
        user_id: req.user.id,
        code: body.code,
        description: body.description || "",
        type: body.type,
        value: Number(body.value),
        maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : undefined,
        minOrderAmount: body.minOrderAmount != null ? Number(body.minOrderAmount) : undefined,
        startDate: start,
        endDate: end,
      });
      return res.status(201).json({ success: true, item: created });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ error: true, message: "Discount code already exists for this user" });
      }
      throw e;
    }
  } catch (err) { next(err); }
});

export default router;

