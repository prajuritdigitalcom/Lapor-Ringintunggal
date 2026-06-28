import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  seedDatabaseIfEmpty,
  getStats,
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  addConversationMessage,
  submitRating,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  getNotifications,
  readNotification,
  readAllNotifications
} from "./src/firebaseService";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API ENDPOINTS ---

// GET statistics
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch stats" });
  }
});

// GET all complaints
app.get("/api/pengaduan", async (req, res) => {
  try {
    const list = await getComplaints();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch complaints" });
  }
});

// GET single complaint with conversations
app.get("/api/pengaduan/:id", async (req, res) => {
  try {
    const result = await getComplaintById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch complaint detail" });
  }
});

// POST create complaint
app.post("/api/pengaduan", async (req, res) => {
  try {
    const newComplaint = await createComplaint(req.body);
    res.status(201).json(newComplaint);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create complaint" });
  }
});

// POST update status
app.post("/api/pengaduan/:id/status", async (req, res) => {
  try {
    const { status, alasanDitolak, fotoAfter, catatanAdmin } = req.body;
    const result = await updateComplaintStatus(req.params.id, status, alasanDitolak, fotoAfter, catatanAdmin);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update status" });
  }
});

// POST append conversation message
app.post("/api/pengaduan/:id/percakapan", async (req, res) => {
  try {
    const { pengirim, namaPengirim, pesan } = req.body;
    const newMsg = await addConversationMessage(req.params.id, pengirim, namaPengirim, pesan);
    res.status(201).json(newMsg);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to add message" });
  }
});

// POST submit rating
app.post("/api/pengaduan/:id/rating", async (req, res) => {
  try {
    const { rating, ratingKomentar } = req.body;
    const updated = await submitRating(req.params.id, rating, ratingKomentar);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to submit rating" });
  }
});

// GET admins
app.get("/api/admins", async (req, res) => {
  try {
    const list = await getAdmins();
    // Filter out passwords
    const cleanAdmins = list.map(({ passwordHash, ...rest }: any) => rest);
    res.json(cleanAdmins);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch admins" });
  }
});

// POST create admin
app.post("/api/admins", async (req, res) => {
  try {
    const cleanAdmin = await createAdmin(req.body);
    res.status(201).json(cleanAdmin);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create admin" });
  }
});

// PUT edit admin
app.put("/api/admins/:id", async (req, res) => {
  try {
    const cleanAdmin = await updateAdmin(req.params.id, req.body);
    res.json(cleanAdmin);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update admin" });
  }
});

// DELETE admin
app.delete("/api/admins/:id", async (req, res) => {
  try {
    await deleteAdmin(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete admin" });
  }
});

// POST login admin
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const cleanUser = await loginAdmin(username, password);
    if (!cleanUser) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    res.json({
      token: `token-${cleanUser.id}-${Date.now()}`,
      user: cleanUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Authentication error" });
  }
});

// GET all notifications
app.get("/api/notifikasi", async (req, res) => {
  try {
    const list = await getNotifications();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
});

// POST read notification
app.post("/api/notifikasi/:id/dibaca", async (req, res) => {
  try {
    await readNotification(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update notification" });
  }
});

// POST read all notifications
app.post("/api/notifikasi/baca-semua", async (req, res) => {
  try {
    await readAllNotifications(req.body.target);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to clear notifications" });
  }
});

// --- MOUNT VITE MIDDLEWARE ---
async function start() {
  // Ensure database is initialized at startup
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start();
} else {
  // If running in Vercel serverless function, still run seeding (cold start)
  seedDatabaseIfEmpty().catch((err) => {
    console.error("Failed to seed database during cold start:", err);
  });
}

export default app;
