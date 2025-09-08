import express from "express";
import userRoutes from "./libsql/users.js";
import noteRoutes from "./libsql/notes.js";
import mongoUsers from "./mongo/users.js";
import mongoNotes from "./mongo/notes.js";

export default (db) => {
  const router = express.Router();
  router.use(userRoutes());
  router.use(noteRoutes());
  router.use("/mongo", mongoUsers);
  router.use("/mongo", mongoNotes);
  return router;
};
