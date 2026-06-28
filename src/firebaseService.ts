import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Firestore
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { Complaint, ConversationMessage, AdminUser, Notification, VillageStats } from "./types";

const firebaseConfigLocal = {
  projectId: "gen-lang-client-0861572108",
  appId: "1:525628589485:web:d5cde87f999c6d88b50d24",
  apiKey: "AIzaSyDALy29qVVdu6JMK7O9P7t1MlANWIkd-lc",
  authDomain: "gen-lang-client-0861572108.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-laporringintungg-a942ee9c-42a3-422b-9c6f-cc08a30b3e3b",
  storageBucket: "gen-lang-client-0861572108.firebasestorage.app",
  messagingSenderId: "525628589485",
  measurementId: ""
};

let db: Firestore;
let firebaseInitError: any = null;

// Initialize Firebase
try {
  let firebaseConfig: any = null;

  // 1. Try to read from environment variables first (ideal for Render/production)
  if (process.env.FIREBASE_CONFIG) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log("Firebase config loaded from FIREBASE_CONFIG environment variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_CONFIG env variable as JSON:", e);
    }
  } else if (process.env.FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID
    };
    console.log("Firebase config loaded from individual environment variables.");
  }

  // 2. Fallback to reading file via fs (extremely robust for runtime)
  if (!firebaseConfig) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        console.log("Firebase config loaded via fs from firebase-applet-config.json.");
      }
    } catch (e) {
      console.error("Failed to read firebase-applet-config.json via fs:", e);
    }
  }

  // 3. Fallback to imported/bundled config
  if (!firebaseConfig) {
    const rawConfig = firebaseConfigLocal as any;
    firebaseConfig = rawConfig && rawConfig.default ? rawConfig.default : rawConfig;
    console.log("Firebase config loaded from bundled firebase-applet-config.json.");
  }

  if (!firebaseConfig) {
    throw new Error("Firebase configuration not found! Please set Firebase environment variables or ensure firebase-applet-config.json is present.");
  }
  
  const firebaseApp = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });

  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
  console.log("Firebase initialized successfully with project ID:", firebaseConfig.projectId);
} catch (error: any) {
  firebaseInitError = error;
  console.error("Failed to initialize Firebase:", error);
}

function checkFirebaseInit() {
  if (firebaseInitError) {
    throw new Error(`Firebase failed to initialize on startup: ${firebaseInitError.message || firebaseInitError}`);
  }
  if (!db) {
    throw new Error("Firestore instance 'db' is undefined. Make sure Firebase is properly configured.");
  }
}

// Default Seed Data
const defaultDb = {
  pengaduan: [
    {
      id: "LR-20260625-0001",
      tanggal: "2026-06-25T08:15:00.000Z",
      modeIdentitas: "terbuka" as const,
      nama: "Akhmad Fauzi",
      nomorWhatsapp: "081234567890",
      rt: "RT 04",
      kategori: "Kebersihan",
      judul: "Tumpukan Sampah di Samping Jembatan RT 04",
      isi: "Tolong dibersihkan tumpukan sampah liar di samping jembatan RT 04 dekat mushola. Baunya sangat menyengat terutama saat sore hari, mengganggu kenyamanan jamaah mushola dan pengguna jalan.",
      fotoBefore: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=60",
      fotoAfter: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60",
      status: "selesai" as const,
      rating: "sangat_puas" as const,
      ratingKomentar: "Terima kasih pak kades dan jajaran, responnya sangat cepat! Sekarang jembatan sudah bersih dan tidak bau lagi.",
      tanggalUpdate: "2026-06-26T10:00:00.000Z"
    },
    {
      id: "LR-20260626-0002",
      tanggal: "2026-06-26T19:30:00.000Z",
      modeIdentitas: "rahasia" as const,
      nama: "Siti Rahmawati",
      nomorWhatsapp: "085712345678",
      rt: "RT 08",
      kategori: "Lampu Jalan",
      judul: "Lampu Jalan Utama RT 08 Mati Total",
      isi: "Lampu penerangan jalan utama di RT 08 sudah mati selama 3 hari berturut-turut. Kondisi jalan menjadi sangat gelap gulita di malam hari, rawan tindakan kriminalitas dan kecelakaan. Mohon segera diperbaiki.",
      fotoBefore: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=60",
      status: "diproses" as const,
      tanggalUpdate: "2026-06-27T09:15:00.000Z"
    },
    {
      id: "LR-20260627-0003",
      tanggal: "2026-06-27T10:00:00.000Z",
      modeIdentitas: "anonim" as const,
      rt: "RT 12",
      kategori: "Infrastruktur",
      judul: "Saluran Irigasi Sawah RT 12 Tersumbat Lumpur",
      isi: "Saluran irigasi sawah di blok timur RT 12 tersumbat endapan lumpur tebal akibat hujan deras kemarin lusa. Air meluap ke sebagian jalan tani dan pasokan air ke sawah bagian bawah terganggu. Butuh kerja bakti atau bantuan pengerukan dari desa.",
      status: "dibaca" as const,
      tanggalUpdate: "2026-06-27T13:40:00.000Z"
    },
    {
      id: "LR-20260627-0004",
      tanggal: "2026-06-27T16:45:00.000Z",
      modeIdentitas: "terbuka" as const,
      nama: "Budi Santoso",
      nomorWhatsapp: "089988776655",
      rt: "RT 01",
      kategori: "Keamanan",
      judul: "Keberadaan Portal Jalan yang Rusak",
      isi: "Portal keamanan di gang masuk RT 01 engselnya patah sehingga tidak bisa ditutup saat malam hari. Mohon bantuan bimbingan atau subsidi perbaikan demi kelancaran siskamling desa.",
      status: "baru" as const,
      tanggalUpdate: "2026-06-27T16:45:00.000Z"
    }
  ],
  percakapan: [
    {
      id: "msg-1",
      idPengaduan: "LR-20260625-0001",
      pengirim: "admin" as const,
      namaPengirim: "Operator Desa (Samsul)",
      pesan: "Laporan kami terima pak. Petugas kebersihan BUMDes akan segera menindaklanjuti ke lokasi jembatan pagi ini.",
      tanggal: "2026-06-25T09:00:00.000Z"
    },
    {
      id: "msg-2",
      idPengaduan: "LR-20260625-0001",
      pengirim: "warga" as const,
      namaPengirim: "Akhmad Fauzi",
      pesan: "Baik pak, terima kasih banyak atas respon cepatnya. Ditunggu kedatangan petugas.",
      tanggal: "2026-06-25T09:15:00.000Z"
    },
    {
      id: "msg-3",
      idPengaduan: "LR-20260625-0001",
      pengirim: "admin" as const,
      namaPengirim: "Operator Desa (Samsul)",
      pesan: "Alhamdulillah tumpukan sampah liar di jembatan RT 04 sudah berhasil kami bersihkan dan diangkut seluruhnya menggunakan armada pengangkut sampah desa. Foto tindak lanjut sudah kami sertakan. Terima kasih atas laporannya!",
      tanggal: "2026-06-26T10:00:00.000Z"
    },
    {
      id: "msg-4",
      idPengaduan: "LR-20260626-0002",
      pengirim: "admin" as const,
      namaPengirim: "Operator Desa (Samsul)",
      pesan: "Laporan sudah kami teruskan ke penanggung jawab sarana dan prasarana desa. Sedang dikoordinasikan untuk pengadaan lampu bohlam pengganti.",
      tanggal: "2026-06-27T09:15:00.000Z"
    },
    {
      id: "msg-5",
      idPengaduan: "LR-20260626-0002",
      pengirim: "warga" as const,
      namaPengirim: "Pelapor (Rahasia)",
      pesan: "Terima kasih pak, mohon kalau bisa sebelum hari Jumat karena malam Jumat ada pengajian di RT sebelah, warga banyak lewat jalan gelap ini.",
      tanggal: "2026-06-27T18:00:00.000Z"
    }
  ],
  admins: [
    {
      id: "adm-1",
      username: "admin",
      passwordHash: "admin123",
      nama: "Samsul Hadi (Operator)",
      role: "operator" as const
    },
    {
      id: "adm-2",
      username: "kades",
      passwordHash: "kades123",
      nama: "H. Sugeng Wibowo (Kepala Desa)",
      role: "kepala_desa" as const
    },
    {
      id: "adm-3",
      username: "bapak_rt",
      passwordHash: "rt123",
      nama: "Akhmad (Perangkat Desa)",
      role: "perangkat" as const
    }
  ],
  notifikasi: [
    {
      id: "notif-1",
      target: "admin" as const,
      idPengaduan: "LR-20260627-0004",
      judul: "Pengaduan Baru Masuk",
      pesan: "Warga melaporkan: Keberadaan Portal Jalan yang Rusak di RT 01",
      tanggal: "2026-06-27T16:45:00.000Z",
      dibaca: false
    },
    {
      id: "notif-2",
      target: "warga" as const,
      idPengaduan: "LR-20260626-0002",
      judul: "Laporan Anda Sedang Diproses",
      pesan: "Laporan mengenai Lampu Jalan Utama RT 08 Mati Total statusnya diubah menjadi DIPROSES.",
      tanggal: "2026-06-27T09:15:00.000Z",
      dibaca: false
    },
    {
      id: "notif-3",
      target: "admin" as const,
      idPengaduan: "LR-20260626-0002",
      judul: "Komentar Baru dari Warga",
      pesan: "Pelapor menambahkan tanggapan pada laporan Lampu Jalan RT 08",
      tanggal: "2026-06-27T18:00:00.000Z",
      dibaca: false
    }
  ]
};

// Seed database helper
export async function seedDatabaseIfEmpty() {
  try {
    checkFirebaseInit();
    const colRef = collection(db, "pengaduan");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log("Firestore database is empty. Seeding with default data...");
      
      // Load current local db.json if it exists, to preserve any edits the user made before
      let sourceDb = defaultDb;
      const dbJsonPath = path.join(process.cwd(), "src", "db.json");
      if (fs.existsSync(dbJsonPath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(dbJsonPath, "utf8"));
          if (fileData.pengaduan && fileData.pengaduan.length > 0) {
            sourceDb = fileData;
            console.log("Using existing local db.json data for seeding.");
          }
        } catch (e) {
          console.error("Failed to read local db.json for seeding, falling back to static defaults.", e);
        }
      }

      // Seed complaints
      for (const item of sourceDb.pengaduan) {
        await setDoc(doc(db, "pengaduan", item.id), item);
      }
      
      // Seed messages
      for (const item of sourceDb.percakapan) {
        await setDoc(doc(db, "percakapan", item.id), item);
      }
      
      // Seed admins
      for (const item of sourceDb.admins) {
        await setDoc(doc(db, "admins", item.id), item);
      }
      
      // Seed notifications
      for (const item of sourceDb.notifikasi) {
        await setDoc(doc(db, "notifikasi", item.id), item);
      }
      
      console.log("Database seeded successfully!");
    } else {
      console.log("Firestore database already contains data. Skipping seeding.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Exported Service Methods

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

export async function getComplaints(): Promise<Complaint[]> {
  checkFirebaseInit();
  const colRef = collection(db, "pengaduan");
  const snapshot = await getDocs(colRef);
  const list: Complaint[] = [];
  snapshot.forEach((docSnap) => {
    list.push(docSnap.data() as Complaint);
  });
  // Sort descending by date (newest first)
  return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function getComplaintById(id: string): Promise<{ item: Complaint; percakapan: ConversationMessage[] } | null> {
  checkFirebaseInit();
  const docRef = doc(db, "pengaduan", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  const item = docSnap.data() as Complaint;

  const chatCol = collection(db, "percakapan");
  const chatQuery = query(chatCol, where("idPengaduan", "==", id));
  const chatSnapshot = await getDocs(chatQuery);
  const percakapan: ConversationMessage[] = [];
  chatSnapshot.forEach((docSnap) => {
    percakapan.push(docSnap.data() as ConversationMessage);
  });
  // Sort ascending by date
  percakapan.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  return { item, percakapan };
}

export async function createComplaint(complaintData: Partial<Complaint>): Promise<Complaint> {
  const { modeIdentitas, nama, nomorWhatsapp, rt, kategori, judul, isi, fotoBefore } = complaintData;

  if (!modeIdentitas || !rt || !kategori || !judul || !isi) {
    throw new Error("Mohon isi semua data wajib");
  }

  // Generate ticket number: LR-YYYYMMDD-XXXX
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const allComplaints = await getComplaints();
  const todayReports = allComplaints.filter((p) => p.id.startsWith(`LR-${dateStr}-`));
  let nextNum = 1;
  if (todayReports.length > 0) {
    const numbers = todayReports.map((p) => {
      const parts = p.id.split("-");
      return parseInt(parts[2], 10);
    });
    nextNum = Math.max(...numbers) + 1;
  }
  const ticketId = `LR-${dateStr}-${String(nextNum).padStart(4, "0")}`;

  const nowIso = new Date().toISOString();
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

  await setDoc(doc(db, "pengaduan", ticketId), newComplaint);

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
  await setDoc(doc(db, "notifikasi", newNotif.id), newNotif);

  return newComplaint;
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  alasanDitolak?: string,
  fotoAfter?: string,
  catatanAdmin?: string
): Promise<{ complaint: Complaint; sysMessage: ConversationMessage }> {
  const docRef = doc(db, "pengaduan", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = docSnap.data() as Complaint;
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

  await setDoc(docRef, complaint);

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
  await setDoc(doc(db, "percakapan", sysMessage.id), sysMessage);

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
  await setDoc(doc(db, "notifikasi", newNotif.id), newNotif);

  return { complaint, sysMessage };
}

export async function addConversationMessage(
  idPengaduan: string,
  pengirim: "warga" | "admin",
  namaPengirim: string,
  pesan: string
): Promise<ConversationMessage> {
  const docRef = doc(db, "pengaduan", idPengaduan);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = docSnap.data() as Complaint;
  const nowIso = new Date().toISOString();
  const newMsg: ConversationMessage = {
    id: `msg-${Date.now()}`,
    idPengaduan,
    pengirim,
    namaPengirim: namaPengirim || (pengirim === "admin" ? "Admin" : "Warga"),
    pesan,
    tanggal: nowIso
  };

  await setDoc(doc(db, "percakapan", newMsg.id), newMsg);

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
  await setDoc(doc(db, "notifikasi", newNotif.id), newNotif);

  return newMsg;
}

export async function submitRating(id: string, rating: string, ratingKomentar?: string): Promise<Complaint> {
  const docRef = doc(db, "pengaduan", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Pengaduan tidak ditemukan");
  }

  const complaint = docSnap.data() as Complaint;
  complaint.rating = rating as any;
  complaint.ratingKomentar = ratingKomentar || "";
  complaint.tanggalUpdate = new Date().toISOString();

  await setDoc(docRef, complaint);

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
  await setDoc(doc(db, "notifikasi", newNotif.id), newNotif);

  return complaint;
}

export async function getAdmins(): Promise<AdminUser[]> {
  checkFirebaseInit();
  const colRef = collection(db, "admins");
  const snapshot = await getDocs(colRef);
  const list: AdminUser[] = [];
  snapshot.forEach((docSnap) => {
    list.push(docSnap.data() as AdminUser);
  });
  return list;
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
    passwordHash: password, // Store passwordHash as plain string matching the demo
    nama,
    role: role as any
  };

  await setDoc(doc(db, "admins", newAdmin.id), newAdmin);

  const { passwordHash, ...cleanAdmin } = newAdmin;
  return cleanAdmin;
}

export async function updateAdmin(id: string, adminData: Partial<AdminUser> & { password?: string }): Promise<Omit<AdminUser, "passwordHash">> {
  const docRef = doc(db, "admins", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Admin tidak ditemukan");
  }

  const admin = docSnap.data() as AdminUser;
  admin.nama = adminData.nama || admin.nama;
  admin.role = (adminData.role || admin.role) as any;
  if (adminData.password) {
    admin.passwordHash = adminData.password;
  }

  await setDoc(docRef, admin);

  const { passwordHash, ...cleanAdmin } = admin;
  return cleanAdmin;
}

export async function deleteAdmin(id: string): Promise<void> {
  const admins = await getAdmins();
  if (admins.length <= 1) {
    throw new Error("Minimal harus ada satu admin aktif di sistem");
  }

  const docRef = doc(db, "admins", id);
  await deleteDoc(docRef);
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

export async function getNotifications(): Promise<Notification[]> {
  checkFirebaseInit();
  const colRef = collection(db, "notifikasi");
  const snapshot = await getDocs(colRef);
  const list: Notification[] = [];
  snapshot.forEach((docSnap) => {
    list.push(docSnap.data() as Notification);
  });
  // Newest first
  return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function readNotification(id: string): Promise<void> {
  const docRef = doc(db, "notifikasi", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const notif = docSnap.data() as Notification;
    notif.dibaca = true;
    await setDoc(docRef, notif);
  }
}

export async function readAllNotifications(target?: string): Promise<void> {
  const colRef = collection(db, "notifikasi");
  const snapshot = await getDocs(colRef);
  for (const docSnap of snapshot.docs) {
    const notif = docSnap.data() as Notification;
    if (!target || notif.target === target) {
      notif.dibaca = true;
      await setDoc(docSnap.ref, notif);
    }
  }
}
