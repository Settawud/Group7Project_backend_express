import { Schema, model } from "mongoose";

const NoteSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  userId: { type: String, required: true },
  embedding: { type: [Number], required: false },
  createdOn: { type: Date, default: new Date().getTime() },
});

export const Note = model("Note", NoteSchema);
