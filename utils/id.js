import crypto from "node:crypto";

export const randomId = (prefix = "id") => {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    // Fallback for environments without randomUUID
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
};

export const skuId = (name = "SKU") => {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  return `${base}-${Math.floor(Math.random() * 900 + 100)}`;
};

