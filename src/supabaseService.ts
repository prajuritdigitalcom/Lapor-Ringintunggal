import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { Complaint, ConversationMessage, AdminUser, Notification, VillageStats } from "./types.js";

const supabaseUrl = process.env.SUPABASE_URL || "https://zzojrxcepxdwqwvhkyts.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_F4Q8WfKNZuwZ1AV6nHArcg_uoAjc5DQ";

let supabase: any = null;
let useSupabase = false;

if (supabaseUrl && typeof supabaseUrl === "string" && supabaseUrl.startsWith("http") && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    useSupabase = true;
    console.log("Supabase client initialized with URL:", supabaseUrl);
  } catch (err: any) {
    console.error("Failed to initialize Supabase client:", err.message || err);
  }
} else {
  console.log("Supabase credentials missing or invalid. Running in robust local database fallback mode.");
}

// --- LOCAL DATABASE ENGINE WITH MEMORY FALLBACK ---
const dbJsonPath = path.join(process.cwd(), "src", "db.json");

let memoryDb: {
  pengaduan: Complaint[];
  percakapan: ConversationMessage[];
  admins: AdminUser[];
  notifikasi: Notification[];
} = { pengaduan: [], percakapan: [], admins: [], notifikasi: [] };

// Load initial data once on startup (read-only is safe on Vercel)
try {
  if (fs.existsSync(dbJsonPath)) {
    memoryDb = JSON.parse(fs.readFileSync(dbJsonPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to load local db.json on startup:", e);
}

function getLocalData(): {
  pengaduan: Complaint[];
  percakapan: ConversationMessage[];
  admins: AdminUser[];
  notifikasi: Notification[];
} {
  return memoryDb;
}

function saveLocalData(data: any) {
  memoryDb = data;
  try {
    if (!process.env.VERCEL) {
      fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), "utf8");
    }
  } catch (e) {
    console.error("Failed to write local db.json:", e);
  }
}

// --- SECURE & SILENT QUERY WRAPPER WITH AUTO-FALLBACK ---
async function runQuery<T>(supabaseFn: () => Promise<any>, fallbackFn: () => any): Promise<T> {
  if (useSupabase && supabase) {
    try {
      // Race the Supabase query against a 4-second timeout to prevent serverless function hangs
      const res = await Promise.race([
        supabaseFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase request timed out after 4000ms")), 4000))
      ]);

      if (!res || res.error || res.data === undefined || res.data === null) {
        if (res && res.error) {
          console.warn("Supabase query returned error, falling back to local file DB:", res.error.message);
        }
        return fallbackFn() as T;
      }
      return res.data as T;
    } catch (err: any) {
      console.error("Supabase exception or timeout, falling back to local file DB:", err.message || err);
    }
  }
  return fallbackFn() as T;
}

// --- DATABASE SEEDER ---
export async function seedDatabaseIfEmpty() {
  console.log("Checking if database seeding is required...");
  
  // Seed local db.json if empty
  const local = getLocalData();
  let localChanged = false;

  const defaultAdmins: AdminUser[] = [
    {
      id: "adm-1",
      username: "admin",
      passwordHash: "admin123",
      nama: "Samsul Hadi (Operator)",
      role: "operator"
    },
    {
      id: "adm-2",
      username: "kades",
      passwordHash: "kades123",
      nama: "H. Sugeng Wibowo (Kepala Desa)",
      role: "kepala_desa"
    },
    {
      id: "adm-3",
      username: "bapak_rt",
      passwordHash: "rt123",
      nama: "Akhmad (Perangkat Desa)",
      role: "perangkat"
    }
  ];

  if (!local.admins || local.admins.length === 0) {
    local.admins = defaultAdmins;
    localChanged = true;
  }
  if (!local.pengaduan) {
    local.pengaduan = [];
    localChanged = true;
  }
  if (!local.percakapan) {
    local.percakapan = [];
    localChanged = true;
  }
  if (!local.notifikasi) {
    local.notifikasi = [];
    localChanged = true;
  }

  if (localChanged) {
    saveLocalData(local);
  }

  // Seed Supabase if active
  if (useSupabase && supabase) {
    try {
      const { data: adminsCount, error } = await supabase.from("admins").select("id", { count: "exact", head: true });
      if (!error && adminsCount === null) {
        console.log("Seeding default admins into Supabase...");
        await supabase.from("admins").insert(defaultAdmins);
      }
    } catch (e) {
      console.log("Could not seed Supabase (likely tables do not exist yet).");
    }
  }
}

// --- VILLAGE STATISTICS ---
export async function getStats(): Promise<VillageStats> {
  const list = await getComplaints();
  return {
    total: list.length,
    baru: list.filter((p) => p.status === "baru").length,
    dibaca: list.filter((p) => p.status === "dibaca").length,
    diproses: list.filter((p) => p.status === "diproses").length,
    selesai: list.filter((p) => p.status === "selesai").length,
    ditolak: list.filter((p) => p.status === "ditolak").length,
  };
}

// --- COMPLAINTS (PENGADUAN) OPERATIONS ---
export async function getComplaints(): Promise<Complaint[]> {
  return runQuery<Complaint[]>(
    async () => supabase.from("pengaduan").select("*"),
    () => getLocalData().pengaduan
  ).then((list) => {
    const validList = Array.isArray(list) ? list : [];
    return validList.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  });
}

export async function getComplaintById(id: string): Promise<{ item: Complaint; percakapan: ConversationMessage[] } | null> {
  const item = await runQuery<Complaint | null>(
    async () => {
      const { data, error } = await supabase.from("pengaduan").select("*").eq("id", id).maybeSingle();
      if (error) return { data: null, error };
      return { data, error: null };
    },
    () => {
      const local = getLocalData();
      return local.pengaduan.find((p) => p.id === id) || null;
    }
  );

  if (!item) return null;

  const percakapan = await runQuery<ConversationMessage[]>(
    async () => supabase.from("percakapan").select("*").eq("idPengaduan", id),
    () => {
      const local = getLocalData();
      return (local.percakapan || []).filter((m) => m.idPengaduan === id);
    }
  );

  const sortedPercakapan = (percakapan || []).sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  return { item, percakapan: sortedPercakapan };
}

export async function createComplaint(complaintData: Partial<Complaint>): Promise<Complaint> {
  const { modeIdentitas, nama, nomorWhatsapp, rt, kategori, judul, isi, fotoBefore } = complaintData;

  if (!modeIdentitas || !rt || !kategori || !judul || !isi) {
    throw new Error("Mohon isi semua data wajib");
  }

  // Generate ticket number: LR-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
  const allComplaints = await getComplaints();
  const todayReports = allComplaints.filter((p) => p && typeof p.id === "string" && p.id.startsWith(`LR-${dateStr}`));
  let nextNum = 1;
  if (todayReports.length > 0) {
    const numbers = todayReports.map((p) => {
      const parts = p.id.split("-");
      const num = parseInt(parts[2], 10);
      return isNaN(num) ? 0 : num;
    });
    nextNum = Math.max(...numbers) + 1;
  }
  const ticketId = `LR-${dateStr}-${String(nextNum).padStart(4, "0")}`;

  const nowIso = now.toISOString();
  const newComplaint: Complaint = {
    id: ticketId,
    tanggal: nowIso,
    modeIdentitas: modeIdentitas as any,
    rt,
    kategori,
    judul,
    isi,
    status: "baru",
    tanggalUpdate: nowIso,
  };

  if (fotoBefore) {
    newComplaint.fotoBefore = fotoBefore;
  }

  if (modeIdentitas !== "anonim") {
    newComplaint.nama = nama || "Warga";
    newComplaint.nomorWhatsapp = nomorWhatsapp || "";
  }

  // Save to database
  const saved = await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("pengaduan").insert(newComplaint);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.pengaduan.push(newComplaint);
      saveLocalData(local);
      return true;
    }
  );

  // Add system notification for admin
  const newNotif: Notification = {
    id: `notif-${Date.now()}`,
    target: "admin",
    idPengaduan: ticketId,
    judul: "Pengaduan Baru Masuk",
    pesan: `Laporan dari RT ${rt.replace("RT ", "")}: "${judul}"`,
    tanggal: nowIso,
    dibaca: false
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("notifikasi").insert(newNotif);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.notifikasi.push(newNotif);
      saveLocalData(local);
      return true;
    }
  );

  return newComplaint;
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  alasanDitolak?: string,
  fotoAfter?: string,
  catatanAdmin?: string
): Promise<{ complaint: Complaint; sysMessage: ConversationMessage }> {
  const result = await getComplaintById(id);
  if (!result) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = result.item;
  const oldStatus = complaint.status;
  complaint.status = status as any;
  const nowIso = new Date().toISOString();
  complaint.tanggalUpdate = nowIso;

  if (status === "ditolak") {
    complaint.alasanDitolak = alasanDitolak || "Tidak memenuhi syarat pengaduan.";
  } else {
    delete complaint.alasanDitolak;
  }

  if (fotoAfter) {
    complaint.fotoAfter = fotoAfter;
  }

  // Update in database
  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("pengaduan").upsert(complaint);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      const idx = local.pengaduan.findIndex((p) => p.id === id);
      if (idx !== -1) {
        local.pengaduan[idx] = complaint;
        saveLocalData(local);
      }
      return true;
    }
  );

  // Auto add conversation message about status change
  const statusLabels: Record<string, string> = {
    baru: "Baru",
    dibaca: "Dibaca",
    diproses: "Diproses",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };
  
  let sysMsg = `Status laporan diubah dari [${statusLabels[oldStatus] || oldStatus}] menjadi [${statusLabels[status]}].`;
  if (status === "ditolak" && alasanDitolak) {
    sysMsg += ` Alasan: ${alasanDitolak}`;
  }
  if (catatanAdmin) {
    sysMsg += ` Catatan: ${catatanAdmin}`;
  }

  const sysMessage: ConversationMessage = {
    id: `msg-${Date.now()}-sys`,
    idPengaduan: complaint.id,
    pengirim: "admin",
    namaPengirim: "Sistem Lapor",
    pesan: sysMsg,
    tanggal: nowIso
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("percakapan").insert(sysMessage);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.percakapan.push(sysMessage);
      saveLocalData(local);
      return true;
    }
  );

  // Notify citizen
  const newNotif: Notification = {
    id: `notif-${Date.now()}`,
    target: "warga",
    idPengaduan: complaint.id,
    judul: `Laporan ${complaint.id} Diperbarui`,
    pesan: `Status laporan Anda saat ini adalah: ${statusLabels[status].toUpperCase()}`,
    tanggal: nowIso,
    dibaca: false
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("notifikasi").insert(newNotif);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.notifikasi.push(newNotif);
      saveLocalData(local);
      return true;
    }
  );

  return { complaint, sysMessage };
}

export async function addConversationMessage(
  idPengaduan: string,
  pengirim: "warga" | "admin",
  namaPengirim: string,
  pesan: string
): Promise<ConversationMessage> {
  const result = await getComplaintById(idPengaduan);
  if (!result) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = result.item;
  const nowIso = new Date().toISOString();
  const newMsg: ConversationMessage = {
    id: `msg-${Date.now()}`,
    idPengaduan,
    pengirim,
    namaPengirim: namaPengirim || (pengirim === "admin" ? "Admin" : "Warga"),
    pesan,
    tanggal: nowIso
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("percakapan").insert(newMsg);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.percakapan.push(newMsg);
      saveLocalData(local);
      return true;
    }
  );

  // Notify corresponding user
  const newNotif: Notification = {
    id: `notif-${Date.now()}-chat`,
    target: pengirim === "admin" ? "warga" : "admin",
    idPengaduan: complaint.id,
    judul: pengirim === "admin" ? "Balasan Baru dari Admin" : "Tanggapan Baru dari Warga",
    pesan: `Laporan ${complaint.id}: "${pesan.length > 40 ? pesan.substring(0, 40) + "..." : pesan}"`,
    tanggal: nowIso,
    dibaca: false
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("notifikasi").insert(newNotif);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.notifikasi.push(newNotif);
      saveLocalData(local);
      return true;
    }
  );

  return newMsg;
}

export async function submitRating(id: string, rating: string, ratingKomentar?: string): Promise<Complaint> {
  const result = await getComplaintById(id);
  if (!result) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = result.item;
  complaint.rating = rating as any;
  complaint.ratingKomentar = ratingKomentar || "";
  complaint.tanggalUpdate = new Date().toISOString();

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("pengaduan").upsert(complaint);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      const idx = local.pengaduan.findIndex((p) => p.id === id);
      if (idx !== -1) {
        local.pengaduan[idx] = complaint;
        saveLocalData(local);
      }
      return true;
    }
  );

  // Notify admin
  const ratingLabels: Record<string, string> = {
    sangat_puas: "Sangat Puas ⭐⭐⭐⭐",
    puas: "Puas ⭐⭐⭐",
    cukup_puas: "Cukup Puas ⭐⭐",
    tidak_puas: "Tidak Puas ⭐",
  };
  
  const newNotif: Notification = {
    id: `notif-${Date.now()}-rating`,
    target: "admin",
    idPengaduan: id,
    judul: "Rating Kepuasan Diterima",
    pesan: `Warga memberi rating: ${ratingLabels[rating]} pada laporan ${id}`,
    tanggal: new Date().toISOString(),
    dibaca: false
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("notifikasi").insert(newNotif);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.notifikasi.push(newNotif);
      saveLocalData(local);
      return true;
    }
  );

  return complaint;
}

// --- ADMIN OPERATIONS ---
export async function getAdmins(): Promise<AdminUser[]> {
  return runQuery<AdminUser[]>(
    async () => supabase.from("admins").select("*"),
    () => getLocalData().admins
  );
}

export async function createAdmin(adminData: Partial<AdminUser> & { password?: string }): Promise<Omit<AdminUser, "passwordHash">> {
  const { username, password, nama, role } = adminData;
  if (!username || !password || !nama || !role) {
    throw new Error("Lengkapi semua data admin baru");
  }

  const admins = await getAdmins();
  if (admins.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username sudah digunakan oleh admin lain");
  }

  const newAdmin: AdminUser = {
    id: `adm-${Date.now()}`,
    username,
    passwordHash: password, // Store plain passwordHash for simplicity
    nama,
    role: role as any
  };

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("admins").insert(newAdmin);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      local.admins.push(newAdmin);
      saveLocalData(local);
      return true;
    }
  );

  const { passwordHash, ...cleanAdmin } = newAdmin;
  return cleanAdmin;
}

export async function updateAdmin(id: string, adminData: Partial<AdminUser> & { password?: string }): Promise<Omit<AdminUser, "passwordHash">> {
  const admins = await getAdmins();
  const admin = admins.find((a) => a.id === id);
  if (!admin) {
    throw new Error("Admin tidak ditemukan");
  }

  admin.nama = adminData.nama || admin.nama;
  admin.role = (adminData.role || admin.role) as any;
  if (adminData.password) {
    admin.passwordHash = adminData.password;
  }

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("admins").upsert(admin);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      const idx = local.admins.findIndex((a) => a.id === id);
      if (idx !== -1) {
        local.admins[idx] = admin;
        saveLocalData(local);
      }
      return true;
    }
  );

  const { passwordHash, ...cleanAdmin } = admin;
  return cleanAdmin;
}

export async function deleteAdmin(id: string): Promise<void> {
  const admins = await getAdmins();
  if (admins.length <= 1) {
    throw new Error("Minimal harus ada satu admin aktif di sistem");
  }

  await runQuery<boolean>(
    async () => {
      const { error } = await supabase.from("admins").delete().eq("id", id);
      return { data: !error, error };
    },
    () => {
      const local = getLocalData();
      const idx = local.admins.findIndex((a) => a.id === id);
      if (idx !== -1) {
        local.admins.splice(idx, 1);
        saveLocalData(local);
      }
      return true;
    }
  );
}

export async function loginAdmin(username: string, passwordHash: string): Promise<Omit<AdminUser, "passwordHash"> | null> {
  const admins = await getAdmins();
  const user = admins.find(
    (a) =>
      a.username.toLowerCase() === username.toLowerCase() &&
      a.passwordHash === passwordHash
  );

  if (!user) {
    return null;
  }

  const { passwordHash: _, ...cleanUser } = user;
  return cleanUser;
}

// --- NOTIFICATION OPERATIONS ---
export async function getNotifications(): Promise<Notification[]> {
  return runQuery<Notification[]>(
    async () => supabase.from("notifikasi").select("*"),
    () => getLocalData().notifikasi
  ).then((list) => {
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  });
}

export async function readNotification(id: string): Promise<void> {
  const notifications = await getNotifications();
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.dibaca = true;
    await runQuery<boolean>(
      async () => {
        const { error } = await supabase.from("notifikasi").upsert(notif);
        return { data: !error, error };
      },
      () => {
        const local = getLocalData();
        const idx = local.notifikasi.findIndex((n) => n.id === id);
        if (idx !== -1) {
          local.notifikasi[idx] = notif;
          saveLocalData(local);
        }
        return true;
      }
    );
  }
}

export async function readAllNotifications(target?: string): Promise<void> {
  const notifications = await getNotifications();
  for (const notif of notifications) {
    if (!target || notif.target === target) {
      notif.dibaca = true;
      await runQuery<boolean>(
        async () => {
          const { error } = await supabase.from("notifikasi").upsert(notif);
          return { data: !error, error };
        },
        () => {
          const local = getLocalData();
          const idx = local.notifikasi.findIndex((n) => n.id === notif.id);
          if (idx !== -1) {
            local.notifikasi[idx] = notif;
          }
          saveLocalData(local);
          return true;
        }
      );
    }
  }
}
