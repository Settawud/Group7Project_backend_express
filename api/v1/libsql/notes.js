import express from "express";

const router = express.Router();

export default (db) => {
  // CREATE a note
  router.post("/notes", async (req, res) => {
    const { title, content, tags = [], is_pinned = false, user_id } = req.body;

    if (!user_id) return res.status(400).send("User ID is required");

    const result = await db.execute({
      sql: `
          INSERT INTO notes (title, content, tags, is_pinned, user_id)
          VALUES (?, ?, ?, ?, ?)
        `,
      args: [title, content, JSON.stringify(tags), is_pinned ? 1 : 0, user_id],
    });

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      title,
      content,
      tags,
      is_pinned,
      user_id,
    });
  });
  // READ all notes
  router.get("/notes", async (_req, res) => {
    const result = await db.execute("SELECT * FROM notes");
    const notes = result.rows.map((note) => ({
      ...note,
      tags: JSON.parse(note.tags || "[]"),
      is_pinned: Boolean(note.is_pinned),
    }));
    res.json(notes);
  });
  // READ a specific note
  router.get("/notes/:id", async (req, res) => {
    const result = await db.execute({
      sql: "SELECT * FROM notes WHERE id = ?",
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).send("Note not found");
    }

    const note = result.rows[0];

    res.json({
      ...note,
      tags: JSON.parse(note.tags || "[]"),
      is_pinned: Boolean(note.is_pinned),
    });
  });
  // READ all notes with Author info
  router.get("/notes-with-authors", async (_req, res) => {
    const result = await db.execute(`
        SELECT notes.*, users.name as author_name, users.email as author_email
        FROM notes
        INNER JOIN users ON notes.user_id = users.id
        ORDER BY notes.created_at DESC
      `);

    const notes = result.rows.map((note) => ({
      ...note,
      tags: JSON.parse(note.tags || "[]"),
      is_pinned: Boolean(note.is_pinned),
      author: {
        name: note.author_name,
        email: note.author_email,
      },
    }));

    res.json(notes);
  });
  // UPDATE a note
  router.put("/notes/:id", async (req, res) => {
    const { title, content, tags = [], is_pinned = false } = req.body;

    await db.execute({
      sql: `
          UPDATE notes
          SET title = ?, content = ?, tags = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      args: [
        title,
        content,
        JSON.stringify(tags),
        is_pinned ? 1 : 0,
        req.params.id,
      ],
    });

    res.send("Note updated");
  });
  // PATCH: update tags
  router.patch("/notes/:id/tags", async (req, res) => {
    const { tags } = req.body;
    if (!Array.isArray(tags))
      return res.status(400).send("Tags must be an array");

    await db.execute({
      sql: `
          UPDATE notes
          SET tags = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      args: [JSON.stringify(tags), req.params.id],
    });

    res.send("Tags updated");
  });

  // PATCH: toggle is_pinned
  router.patch("/notes/:id/pin", async (req, res) => {
    const result = await db.execute({
      sql: "SELECT is_pinned FROM notes WHERE id = ?",
      args: [req.params.id],
    });

    if (result.rows.length === 0) return res.status(404).send("Note not found");

    const current = result.rows[0].is_pinned;
    const toggled = current ? 0 : 1;

    await db.execute({
      sql: `
          UPDATE notes
          SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      args: [toggled, req.params.id],
    });

    res.send(`Note pin status set to ${!!toggled}`);
  });

  // DELETE a note
  router.delete("/notes/:id", async (req, res) => {
    await db.execute({
      sql: "DELETE FROM notes WHERE id = ?",
      args: [req.params.id],
    });
    res.send("Note deleted");
  });
  return router;
};
