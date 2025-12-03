import express from "express";
import { query, end } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as now");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error("Health Check Failed:", err);
    res.status(500).json({ status: "error" });
  }
});

// Get Todos
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

// Create Todo
app.post("/api/todos", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await query(
      "INSERT INTO todos (title, completed) VALUES ($1, false) RETURNING id, title, completed",
      [title.trim()]
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

// Graceful Shutdown
const shutdown = () => {
  console.log("SIGTERM/SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    end().then(() => {
      console.log("Database pool closed.");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
