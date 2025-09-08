import express from "express";

const router = express.Router();

export default (db) => {
  // CREATE a user (Do this first! with initialize create user table)
  router.post("/users", async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email)
      return res.status(400).send("Name and email are required");

    const result = await db.execute({
      sql: "INSERT INTO users (name, email) VALUES (?, ?)",
      args: [name, email],
    });

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      name,
      email,
    });
  });
  // GET all notes by user
  router.get("/users/:id/notes", async (req, res) => {
    const userId = req.params.id;

    const result = await db.execute({
      sql: `
          SELECT * FROM notes
          WHERE user_id = ?
          ORDER BY created_at DESC
        `,
      args: [userId],
    });

    const notes = result.rows.map((note) => ({
      ...note,
      tags: JSON.parse(note.tags || "[]"),
      is_pinned: Boolean(note.is_pinned),
    }));

    res.json(notes);
  });
  return router;
};
