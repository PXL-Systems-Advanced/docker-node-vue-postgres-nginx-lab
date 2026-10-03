import express from "express";
import { query, end } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await query("SELECT NOW() AS now");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/todos", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, title, completed FROM todos ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

app.post("/api/todos", async (req, res) => {
  const title = req.body?.title?.trim();
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await query(
      "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed",
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

const server = app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await end();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
