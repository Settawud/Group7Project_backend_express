import express from "express";
// New e-commerce routes
import mongoose from "mongoose";
import mongoProducts from "./mongo/products.routes.js";
import mongoColors from "./mongo/colors.routes.js";
import mongoCart from "./mongo/cart.routes.js";
import mongoOrders from "./mongo/orders.routes.js";
import mongoReviews from "./mongo/reviews.routes.js";
import mongoDiscounts from "./mongo/discounts.routes.js";
import jwtBearer from "../../middleware/jwtBearer.js";
import { register, login, me, updateMe, changePassword, logout, logoutAll } from "./mongo/controllers/user.controller.js";

export default (db) => {
  const router = express.Router();
  // Existing sample routes (mounted only if configured)
  if (process.env.MONGO_URI) {
    // router.use("/mongo", mongoUsers);
    // router.use("/mongo", mongoNotes);
  }

  // E-commerce API v1 (Mongo-only)

  // Mongo-backed auth/users (separate namespace)
  router.post("/api/v1/mongo/auth/register", register);
  router.post("/api/v1/mongo/auth/login", login);
  router.post("/api/v1/mongo/auth/logout", jwtBearer, logout);
  router.post("/api/v1/mongo/auth/logout-all", jwtBearer, logoutAll);
  router.get("/api/v1/mongo/users/me", jwtBearer, me);
  router.patch("/api/v1/mongo/users/me", jwtBearer, updateMe);
  router.patch("/api/v1/mongo/users/me/password", jwtBearer, changePassword);

  // Mongo product/color/cart/order routes
  router.use("/api/v1/mongo/products", mongoProducts);
  router.use("/api/v1/mongo/colors", mongoColors);
  router.use("/api/v1/mongo/cart", mongoCart);
  router.use("/api/v1/mongo/orders", mongoOrders);
  router.use("/api/v1/mongo/reviews", mongoReviews);
  router.use("/api/v1/mongo/discounts", mongoDiscounts);

  // Health: DB readiness
  router.get("/health/db", async (_req, res) => {
    const rs = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const map = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
    const base = {
      readyState: rs,
      state: map[rs] || "unknown",
      dbName: mongoose.connection?.name || process.env.MONGO_DBNAME || null,
      host: mongoose.connection?.host || null,
      appTime: new Date().toISOString(),
    };
    try {
      let pingMs = null;
      if (rs === 1 && mongoose.connection?.db?.admin) {
        const t0 = Date.now();
        await mongoose.connection.db.admin().command({ ping: 1 });
        pingMs = Date.now() - t0;
      }
      const body = { status: rs === 1 ? "ok" : "degraded", pingMs, ...base };
      const code = rs === 1 ? 200 : 503;
      return res.status(code).json(body);
    } catch (err) {
      return res.status(503).json({ status: "error", error: String(err?.message || err), ...base });
    }
  });

  return router;
};
