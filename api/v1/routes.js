import express from "express";
import userRoutes from "./libsql/users.js";
import noteRoutes from "./libsql/notes.js";
import mongoUsers from "./mongo/users.js";
import mongoNotes from "./mongo/notes.js";

// New e-commerce routes
import productsRoutes from "./shop/products.routes.js";
import authRoutes from "./shop/auth.routes.js";
import cartRoutes from "./shop/cart.routes.js";
import ordersRoutes from "./shop/orders.routes.js";

export default (db) => {
  const router = express.Router();
  // Existing sample routes (mounted only if configured)
  if (process.env.TURSO_DB_URL) {
    router.use(userRoutes(db));
    router.use(noteRoutes(db));
  }
  if (process.env.MONGO_URI) {
    router.use("/mongo", mongoUsers);
    router.use("/mongo", mongoNotes);
  }

  // E-commerce API v1
  router.use("/api/v1/auth", authRoutes);
  router.use("/api/v1/products", productsRoutes);
  router.use("/api/v1/cart", cartRoutes);
  router.use("/api/v1/orders", ordersRoutes);
  return router;
};
