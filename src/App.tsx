import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Tag,
  Info,
  ShieldCheck,
  Eye,
  Camera,
  Check,
  CheckCircle2,
  ThumbsUp,
  Star,
  MessageSquare,
  Search,
  Filter,
  Clock,
  ArrowRight,
  Lock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  Sparkles,
  Bell,
} from "lucide-react";

import { Complaint, Notification, VillageStats } from "./types";
import BottomNav from "./components/BottomNav";
import StatsCard from "./components/StatsCard";
import ComplaintCard from "./components/ComplaintCard";
import TimelineView from "./components/TimelineView";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("beranda");
  
  // Data States
  const [stats, setStats] = useState<VillageStats>({
    total: 0,
    baru: 0,
    dibaca: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // User Own Submissions Tracker
  const [myComplaints, setMyComplaints] = useState<string[]>([]);

  // App Filtering / Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [categoryFilter, setCategoryFilter] = useState("semua");

  // Admin Login States
  const [adminUser, setAdminUser] = useState<{ id: string; nama: string; username: string; role: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Create Complaint Form States
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [identityMode, setIdentityMode] = useState<"anonim" | "rahasia" | "terbuka">("anonim");
  const [complaintForm, setComplaintForm] = useState({
    nama: "",
    nomorWhatsapp: "",
    rt: "RT 01",
    kategori: "Infrastruktur",
    judul: "",
    isi: "",
  });
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successReport, setSuccessReport] = useState<Complaint | null>(null);

  // Detail Complaint Dialog States
  const [citizenChatInput, setCitizenChatInput] = useState("");
  const [ratingValue, setRatingValue] = useState<string>("");
  const [ratingComment, setRatingComment] = useState("");
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Core Data
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Gagal mengambil data statistik", e);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/pengaduan");
      if (res.ok) {
        const data = await res.json();
        setAllComplaints(data);
      }
    } catch (e) {
      console.error("Gagal mengambil data laporan", e);
    }
  };

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/notifikasi");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Gagal mengambil data notifikasi", e);
    }
  };

  // Load from database on startup
  useEffect(() => {
    fetchStats();
    fetchComplaints();
    fetchNotifs();

    // Load user's submitted ticket IDs from localStorage
    const saved = localStorage.getItem("lapor_my_tickets");
    if (saved) {
      try {
        setMyComplaints(JSON.parse(saved));
      } catch (_) {}
    }

    // Load admin session if saved
    const savedAdmin = sessionStorage.getItem("lapor_admin_session");
    if (savedAdmin) {
      try {
        setAdminUser(JSON.parse(savedAdmin));
      } catch (_) {}
    }
  }, []);

  // Sync details when selected complaint is open
  useEffect(() => {
    if (selectedComplaint) {
      fetch(`/api/pengaduan/${selectedComplaint.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.item) {
            setSelectedComplaint(data.item);
            setConversations(data.percakapan);
            // Reset rating states if complaint is finished
            setIsRatingSubmitted(!!data.item.rating);
            setRatingValue(data.item.rating || "");
            setRatingComment(data.item.ratingKomentar || "");
          }
        });
    }
  }, [selectedComplaint?.id]);

  // Handle click on stats card to pre-filter and redirect
  const handleStatsFilter = (status: string) => {
    setStatusFilter(status);
    setActiveTab("pengaduan");
    setSelectedComplaint(null);
  };

  // Convert uploaded photo to Base64
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBefore(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Complaint Form
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.judul.trim() || !complaintForm.isi.trim()) {
      alert("Harap lengkapi judul dan isi pengaduan.");
      return;
    }

    if (identityMode !== "anonim" && !complaintForm.nama.trim()) {
      alert("Harap lengkapi nama Anda untuk identitas rahasia atau terbuka.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/pengaduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modeIdentitas: identityMode,
          nama: identityMode !== "anonim" ? complaintForm.nama : undefined,
          nomorWhatsapp: identityMode !== "anonim" ? complaintForm.nomorWhatsapp : undefined,
          rt: complaintForm.rt,
          kategori: complaintForm.kategori,
          judul: complaintForm.judul,
          isi: complaintForm.isi,
          fotoBefore: photoBefore || undefined,
        }),
      });

      if (res.ok) {
        const created: Complaint = await res.json();
        setSuccessReport(created);
        
        // Track locally
        const updatedMyTickets = [created.id, ...myComplaints];
        setMyComplaints(updatedMyTickets);
        localStorage.setItem("lapor_my_tickets", JSON.stringify(updatedMyTickets));

        // Refresh data
        fetchStats();
        fetchComplaints();
        fetchNotifs();

        // Reset form fields
        setComplaintForm({
          nama: "",
          nomorWhatsapp: "",
          rt: "RT 01",
          kategori: "Infrastruktur",
          judul: "",
          isi: "",
        });
        setPhotoBefore(null);
        setFormStep(1);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "Gagal mengirim aduan. Harap coba beberapa saat lagi.";
        alert(`Gagal mengirim aduan: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit citizen comment
  const handleSendCitizenComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !citizenChatInput.trim()) return;

    // Determine sender label according to identity privacy
    let senderName = "Pelapor (Anonim)";
    if (selectedComplaint.modeIdentitas === "terbuka") {
      senderName = selectedComplaint.nama || "Pelapor";
    } else if (selectedComplaint.modeIdentitas === "rahasia") {
      senderName = "Pelapor (Rahasia)";
    }

    try {
      const res = await fetch(`/api/pengaduan/${selectedComplaint.id}/percakapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengirim: "warga",
          namaPengirim: senderName,
          pesan: citizenChatInput,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setConversations([...conversations, newMsg]);
        setCitizenChatInput("");
        fetchNotifs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit satisfaction rating
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !ratingValue) {
      alert("Pilih opsi tingkat kepuasan Anda.");
      return;
    }

    try {
      const res = await fetch(`/api/pengaduan/${selectedComplaint.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingValue,
          ratingKomentar: ratingComment,
        }),
      });

      if (res.ok) {
        setIsRatingSubmitted(true);
        fetchStats();
        fetchComplaints();
        fetchNotifs();
        alert("Terima kasih atas rating pelayanan yang Anda berikan!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin login trigger
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminUser(data.user);
        sessionStorage.setItem("lapor_admin_session", JSON.stringify(data.user));
        // Reset login inputs
        setLoginForm({ username: "", password: "" });
      } else {
        setLoginError(data.error || "Login gagal.");
      }
    } catch (err) {
      setLoginError("Koneksi gagal.");
    }
  };

  // Admin logout trigger
  const handleAdminLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem("lapor_admin_session");
  };

  // Filter lists based on inputs
  const filteredComplaints = allComplaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "semua" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "semua" || c.kategori === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const categories = [
    "Infrastruktur",
    "Lampu Jalan",
    "Kebersihan",
    "Air Bersih",
    "Pelayanan Desa",
    "Keamanan",
    "Bantuan Sosial",
    "BUMDes",
    "Pasar Desa",
    "Lingkungan",
    "Lainnya",
  ];

  const rtList = Array.from({ length: 10 }, (_, i) => `RT ${String(i + 1).padStart(2, "0")}`);

  // Count unread notifications
  const citizenUnreadCount = notifications.filter((n) => n.target === "warga" && !n.dibaca).length;
  const adminUnreadCount = notifications.filter((n) => n.target === "admin" && !n.dibaca).length;

  const handleMarkAllNotifsRead = async (target: "warga" | "admin") => {
    try {
      const res = await fetch("/api/notifikasi/baca-semua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      if (res.ok) {
        fetchNotifs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Mock-PWA Container Frame for Beautiful Mobile-First Presentation */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col pb-20 border-x border-slate-100">
        
        {/* HEADER SECTION */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-50 px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img
              src="https://i.ibb.co.com/tTzpHtJc/logo-ringintunggal-1.webp"
              alt="Logo Desa Ringintunggal"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-sm font-black font-display tracking-tight text-slate-950 uppercase">
                Ringintunggal
              </h1>
              <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase -mt-0.5">
                Lapor Warga Desa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStats();
                fetchComplaints();
                fetchNotifs();
              }}
              title="Perbarui Data"
              className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA CONTAINER WITH PADDING */}
        <main className="flex-1 px-4 py-4 overflow-y-auto">
          
          {/* TAB 1: BERANDA (HOME SCREEN) */}
          {activeTab === "beranda" && !selectedComplaint && (
            <div className="space-y-6 animate-fade-in">
              {/* Dynamic banner with ambient background */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 relative overflow-hidden shadow-premium">
                {/* Decorative circles */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -left-5 -top-5 w-24 h-24 bg-white/15 rounded-full blur-lg" />

                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                    Suara Warga, Tindak Lanjut Nyata
                  </div>
                  <h2 className="text-xl font-black font-display leading-tight tracking-tight">
                    Layanan Pengaduan & Aspirasi Desa Ringintunggal
                  </h2>
                  <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                    Sampaikan keluhan, infrastruktur rusak, lampu jalan padam, atau bantuan sosial secara transparan dan dipantau progresnya.
                  </p>
                  
                  <button
                    onClick={() => setActiveTab("buat-laporan")}
                    className="mt-2 bg-white text-emerald-800 font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                  >
                    Mulai Buat Pengaduan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Statistics section */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Statistik Aduan Aktif
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold">Ringintunggal Terkini</span>
                </div>
                <StatsCard stats={stats} onFilterClick={handleStatsFilter} />
              </div>

              {/* How it works visual steps guide */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
                  Bagaimana Cara Melapor?
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { num: "1", title: "Kirim Aduan", desc: "Isi form laporan secara anonim / rahasia" },
                    { num: "2", title: "Diproses", desc: "Dipantau & diperbaiki perangkat desa" },
                    { num: "3", title: "Selesai", desc: "Laporan tuntas & beri rating kepuasan" },
                  ].map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="mx-auto w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold font-display text-xs flex items-center justify-center">
                        {step.num}
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">{step.title}</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick trending reports list */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Laporan Terbaru Warga
                  </h3>
                  <button
                    onClick={() => {
                      setStatusFilter("semua");
                      setActiveTab("pengaduan");
                    }}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {[...allComplaints]
                    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                    .slice(0, 3)
                    .map((item) => (
                      <ComplaintCard
                        key={item.id}
                        complaint={item}
                        onClick={() => {
                          setSelectedComplaint(item);
                          setActiveTab("pengaduan");
                        }}
                      />
                    ))}
                  {allComplaints.length === 0 && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-xs text-slate-400">
                      Belum ada laporan warga yang dikirimkan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUAT LAPORAN (CREATE REPORT) */}
          {activeTab === "buat-laporan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-lg font-black font-display tracking-tight text-slate-900">
                  Buat Pengaduan Baru
                </h2>
                <p className="text-xs text-slate-500">
                  Laporkan aspirasi atau keluhan Anda di Desa Ringintunggal dengan cepat & transparan.
                </p>
              </div>

              {successReport ? (
                /* Beautiful confirmation card once report is created successfully */
                <div className="bg-white border border-emerald-100 p-6 rounded-3xl shadow-premium text-center space-y-4 animate-scale-up">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">Aduan Berhasil Dikirim!</h3>
                    <p className="text-xs text-slate-500">Nomor tiket pengaduan Anda berhasil dibuat secara otomatis oleh sistem.</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Nomor Tiket</span>
                    <span className="font-mono text-lg font-bold text-emerald-900 tracking-wider">
                      {successReport.id}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Gunakan nomor tiket di atas untuk memantau status tindak lanjut aduan Anda. Nomor tiket ini juga otomatis terdaftar di halaman profil Anda.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedComplaint(successReport);
                        setSuccessReport(null);
                        setActiveTab("pengaduan");
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft"
                    >
                      Pantau Aduan Saya
                    </button>
                    <button
                      onClick={() => setSuccessReport(null)}
                      className="flex-1 py-2.5 border border-slate-150 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50"
                    >
                      Buat Laporan Lain
                    </button>
                  </div>
                </div>
              ) : (
                /* Report inputs steps */
                <form onSubmit={handleSubmitComplaint} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-5">
                  {formStep === 1 ? (
                    <div className="space-y-5">
                      {/* Identity Selection Block */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Bagaimana Anda ingin menampilkan identitas?
                        </label>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            {
                              id: "anonim",
                              title: "Anonim Penuh",
                              desc: "Identitas sama sekali tidak diketahui oleh siapa pun termasuk admin desa.",
                              badge: "Warga RT XX",
                            },
                            {
                              id: "rahasia",
                              title: "Identitas Rahasia",
                              desc: "Identitas nama dan nomor WhatsApp Anda hanya diketahui oleh admin desa.",
                              badge: "Warga RT XX",
                            },
                            {
                              id: "terbuka",
                              title: "Identitas Terbuka",
                              desc: "Identitas nama dan RT Anda dapat dilihat oleh publik di halaman pengaduan.",
                              badge: "Nama Anda - RT XX",
                            },
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setIdentityMode(mode.id as any)}
                              className={`p-3.5 rounded-2xl text-left border transition-all duration-300 flex items-start gap-3 cursor-pointer ${
                                identityMode === mode.id
                                  ? "border-emerald-500 bg-emerald-50/50"
                                  : "border-slate-100 hover:border-slate-200"
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                identityMode === mode.id ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                              }`}>
                                {identityMode === mode.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-xs font-bold text-slate-900">{mode.title}</span>
                                  <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">{mode.badge}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{mode.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name / Phone details if not full anonymous */}
                      {identityMode !== "anonim" && (
                        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap Anda</label>
                            <input
                              type="text"
                              required
                              placeholder="Masukkan nama sesuai KTP..."
                              value={complaintForm.nama}
                              onChange={(e) => setComplaintForm({ ...complaintForm, nama: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Nomor WhatsApp Aktif</label>
                            <input
                              type="tel"
                              required
                              placeholder="Contoh: 08123456789..."
                              value={complaintForm.nomorWhatsapp}
                              onChange={(e) => setComplaintForm({ ...complaintForm, nomorWhatsapp: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                            <span className="text-[8px] text-slate-400 block mt-0.5">Digunakan oleh admin desa untuk koordinasi penyelesaian di lapangan.</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (identityMode !== "anonim" && !complaintForm.nama.trim()) {
                            alert("Mohon isi nama lengkap Anda.");
                            return;
                          }
                          setFormStep(2);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-1.5"
                      >
                        Lanjutkan Pengisian Laporan
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Step 2 Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block uppercase">Pilih Rukun Tetangga (RT)</label>
                          <select
                            value={complaintForm.rt}
                            onChange={(e) => setComplaintForm({ ...complaintForm, rt: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            {rtList.map((rt) => (
                              <option key={rt} value={rt}>{rt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block uppercase">Kategori Aduan</label>
                          <select
                            value={complaintForm.kategori}
                            onChange={(e) => setComplaintForm({ ...complaintForm, kategori: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            {categories.map((c, i) => (
                              <option key={i} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Judul Pengaduan</label>
                        <input
                          type="text"
                          required
                          placeholder="Tuliskan judul singkat kendala..."
                          value={complaintForm.judul}
                          onChange={(e) => setComplaintForm({ ...complaintForm, judul: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Isi / Detail Pengaduan</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Jelaskan detail permasalahan secara rinci (misal: lokasi jembatan miring, nomor tiang lampu mati)..."
                          value={complaintForm.isi}
                          onChange={(e) => setComplaintForm({ ...complaintForm, isi: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Photo Attachment upload */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Unggah Foto Kendala (Opsional)</label>
                        <div className="flex items-center gap-3">
                          {photoBefore ? (
                            <div className="relative">
                              <img
                                src={photoBefore}
                                alt="Before draft"
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => setPhotoBefore(null)}
                                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full hover:bg-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl p-4 w-16 h-16 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200"
                            >
                              <Camera className="w-5 h-5 text-slate-400" />
                              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Lampiran</span>
                            </button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                          <p className="text-[10px] text-slate-400">
                            Format file gambar (PNG, JPG). Berguna untuk mempermudah survei lapangan perangkat desa.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className="flex-1 py-2.5 border border-slate-150 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50"
                        >
                          Sebelumnya
                        </button>
                        <button
                          type="submit"
                          disabled={submitLoading}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-1"
                        >
                          {submitLoading ? "Mengirim..." : "Kirim Pengaduan"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PENGADUAN PUBLIK LIST (COMPLAINT TIMELINE & REVIEWS) */}
          {activeTab === "pengaduan" && (
            <div className="space-y-4 animate-fade-in">
              {!selectedComplaint ? (
                <>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black font-display tracking-tight text-slate-900">
                      Aduan Publik Warga
                    </h2>
                    <p className="text-xs text-slate-500">
                      Gunakan kolom pencarian atau filter status untuk meninjau penanganan keluhan warga Desa Ringintunggal.
                    </p>
                  </div>

                  {/* Search and Filters box */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft space-y-3">
                    <div className="flex gap-2 relative">
                      <input
                        type="text"
                        placeholder="Cari berdasarkan tiket, judul, atau RT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Filter Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="semua">Semua Status</option>
                          <option value="baru">Baru</option>
                          <option value="dibaca">Dibaca</option>
                          <option value="diproses">Diproses</option>
                          <option value="selesai">Selesai</option>
                          <option value="ditolak">Ditolak</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Filter Kategori</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="semua">Semua Kategori</option>
                          {categories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List output */}
                  <div className="space-y-3">
                    {filteredComplaints.map((item) => (
                      <ComplaintCard
                        key={item.id}
                        complaint={item}
                        onClick={() => setSelectedComplaint(item)}
                      />
                    ))}
                    {filteredComplaints.length === 0 && (
                      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-xs text-slate-400">
                        Tidak ada aduan warga yang cocok dengan kriteria pencarian Anda.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* CITIZEN DETAIL COMPLAINT OVERVIEW AND RESPONSE SCREEN */
                <div className="space-y-5 animate-fade-in">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Kembali ke Daftar Aduan
                  </button>

                  {/* Core detail card */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                        <span className="font-mono text-xs text-slate-400 font-bold">{selectedComplaint.id}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(selectedComplaint.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} WIB
                        </div>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        selectedComplaint.status === "selesai" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                        selectedComplaint.status === "diproses" ? "bg-amber-50 text-amber-800 border-amber-100" :
                        selectedComplaint.status === "ditolak" ? "bg-rose-50 text-rose-800 border-rose-100" :
                        selectedComplaint.status === "dibaca" ? "bg-blue-50 text-blue-800 border-blue-100" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {selectedComplaint.status}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedComplaint.modeIdentitas === "anonim"
                          ? `Anonim (${selectedComplaint.rt})`
                          : `${selectedComplaint.nama} (${selectedComplaint.rt})`}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedComplaint.kategori}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {selectedComplaint.judul}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        {selectedComplaint.isi}
                      </p>
                    </div>

                    {selectedComplaint.fotoBefore && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Foto Sebelum Kendala</span>
                        <img
                          src={selectedComplaint.fotoBefore}
                          alt="Lampiran Sebelum"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-48 object-cover rounded-2xl border border-slate-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Shipment Tracking Timeline */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                      Progres Penanganan Aduan
                    </h3>
                    <TimelineView complaint={selectedComplaint} />
                  </div>

                  {/* TWO-WAY DIALOG CHAT BOARD BETWEEN CITIZEN AND ADMIN */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      Percakapan & Diskusi Tim
                    </h3>

                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                      {conversations.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 font-medium">
                          Belum ada obrolan terkirim. Anda dapat memulai mengirim pesan tanggapan di bawah.
                        </div>
                      ) : (
                        conversations.map((chat) => {
                          const isMe = chat.pengirim === "warga";
                          return (
                            <div
                              key={chat.id}
                              className={`flex flex-col max-w-[85%] ${
                                isMe ? "mr-auto items-start" : "ml-auto items-end"
                              }`}
                            >
                              <span className="text-[9px] text-slate-400 font-bold mb-0.5">{chat.namaPengirim}</span>
                              <div
                                className={`p-3 rounded-2xl text-xs ${
                                  isMe
                                    ? "bg-slate-100 text-slate-800 rounded-tl-none"
                                    : "bg-emerald-600 text-white rounded-tr-none"
                                }`}
                              >
                                {chat.pesan}
                              </div>
                              <span className="text-[8px] text-slate-400 font-mono mt-0.5">
                                {new Date(chat.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendCitizenComment} className="flex gap-2 border-t border-slate-100 pt-3">
                      <input
                        type="text"
                        placeholder="Ketik pesan balasan Anda..."
                        value={citizenChatInput}
                        onChange={(e) => setCitizenChatInput(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        Kirim
                      </button>
                    </form>
                  </div>

                  {/* SATISFACTION FEEDBACK IF SERVICE COMPLETED */}
                  {selectedComplaint.status === "selesai" && (
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-premium space-y-4">
                      <div className="flex gap-2 items-center text-emerald-700">
                        <ThumbsUp className="w-5 h-5 fill-emerald-100" />
                        <h3 className="text-xs font-black uppercase tracking-wider">
                          Beri Kepuasan Layanan
                        </h3>
                      </div>

                      {isRatingSubmitted ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-xs text-emerald-800 font-medium">
                          ⭐⭐⭐⭐ Terima kasih atas evaluasi pelayanan yang Anda berikan. Masukan Anda membantu Desa Ringintunggal berkembang secara prima!
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitRating} className="space-y-4">
                          <p className="text-xs text-slate-600 leading-normal">
                            Apakah Anda puas dengan penanganan pengaduan ini oleh aparat Desa Ringintunggal?
                          </p>

                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { val: "sangat_puas", label: "⭐⭐⭐⭐ Sangat Puas" },
                              { val: "puas", label: "⭐⭐⭐ Puas" },
                              { val: "cukup_puas", label: "⭐⭐ Cukup Puas" },
                              { val: "tidak_puas", label: "⭐ Tidak Puas" },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setRatingValue(opt.val)}
                                className={`p-2 rounded-xl text-[10px] font-bold border transition-all duration-200 cursor-pointer text-center ${
                                  ratingValue === opt.val
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Komentar Tambahan (Opsional)</label>
                            <input
                              type="text"
                              placeholder="Tuliskan apresiasi atau masukan Anda..."
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-soft hover:bg-emerald-700 transition-colors"
                          >
                            Kirim Feedback Kepuasan
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFIKASI */}
          {activeTab === "notifikasi" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black font-display tracking-tight text-slate-900">
                    Notifikasi Sistem
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Update status aduan dan percakapan diskusi terbaru
                  </p>
                </div>
                
                <button
                  onClick={() => handleMarkAllNotifsRead(adminUser ? "admin" : "warga")}
                  className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Tandai Semua Dibaca
                </button>
              </div>

              <div className="space-y-3">
                {notifications
                  .filter((n) => n.target === (adminUser ? "admin" : "warga"))
                  .map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        // Mark as read
                        fetch(`/api/notifikasi/${notif.id}/dibaca`, { method: "POST" }).then(() => {
                          fetchNotifs();
                        });

                        // Route to complaint
                        const item = allComplaints.find((c) => c.id === notif.idPengaduan);
                        if (item) {
                          setSelectedComplaint(item);
                          setActiveTab("pengaduan");
                        }
                      }}
                      className={`w-full text-left p-4 rounded-3xl border shadow-soft flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                        notif.dibaca
                          ? "bg-white border-slate-100 text-slate-600"
                          : "bg-emerald-50/20 border-emerald-100 text-slate-900"
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        notif.dibaca ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold truncate pr-1">{notif.judul}</h4>
                          <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                            {new Date(notif.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{notif.pesan}</p>
                        <span className="font-mono text-[9px] text-emerald-600 block pt-0.5 font-bold">
                          {notif.idPengaduan}
                        </span>
                      </div>
                    </button>
                  ))}

                {notifications.filter((n) => n.target === (adminUser ? "admin" : "warga")).length === 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-xs text-slate-400 font-medium">
                    Belum ada notifikasi yang masuk.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PROFIL / AREA ADMIN LOGIN & PANEL */}
          {activeTab === "profil" && (
            <div className="space-y-6 animate-fade-in">
              {/* If admin is logged in, show full Admin Panel */}
              {adminUser ? (
                <AdminPanel
                  adminUser={adminUser}
                  onLogout={handleAdminLogout}
                  allComplaints={allComplaints}
                  setAllComplaints={setAllComplaints}
                  fetchStats={fetchStats}
                  fetchComplaints={fetchComplaints}
                />
              ) : (
                /* Standard Citizen profile area */
                <div className="space-y-6">
                  {/* Village Identity Header */}
                  <div className="bg-gradient-to-tr from-emerald-800 to-emerald-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 font-display font-black text-6xl select-none translate-x-5 -translate-y-5">
                      DESA
                    </div>
                    <div className="relative z-10 space-y-1">
                      <span className="text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Kabupaten Bojonegoro
                      </span>
                      <h2 className="text-lg font-black font-display mt-2">Ringintunggal</h2>
                      <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                        Kecamatan Gayam • Kabupaten Bojonegoro • Jawa Timur
                      </p>
                    </div>
                  </div>

                  {/* citizen's own tracked reports */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Laporan Saya ({myComplaints.length})
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Tersimpan di perangkat</span>
                    </div>

                    <div className="space-y-3">
                      {myComplaints.map((ticketId) => {
                        const item = allComplaints.find((c) => c.id === ticketId);
                        if (!item) return null;
                        return (
                          <ComplaintCard
                            key={item.id}
                            complaint={item}
                            onClick={() => {
                              setSelectedComplaint(item);
                              setActiveTab("pengaduan");
                            }}
                          />
                        );
                      })}

                      {myComplaints.length === 0 && (
                        <div className="bg-white border border-slate-100 p-6 rounded-3xl text-center text-xs text-slate-400 font-medium space-y-2">
                          <p>Anda belum mengirim laporan apa pun lewat browser ini.</p>
                          <p className="text-[10px]">Setiap aduan yang Anda kirimkan otomatis terekam secara privat di daftar ini.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Elegant Admin Gate Login Collapse */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Gerbang Aparat Desa
                        </h3>
                        <p className="text-[9px] text-slate-400">Khusus Operator, Perangkat, & Kepala Desa</p>
                      </div>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Username</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan username login..."
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Masukkan password..."
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {loginError && (
                        <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2 rounded-xl">
                          ⚠️ {loginError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow-soft transition-colors duration-200"
                      >
                        Masuk Dashboard Desa
                      </button>
                    </form>

                    {/* Simple Help/Info credentials */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-1.5 text-[10px] text-slate-500">
                      <span className="font-bold block text-slate-700">Kredensial Demo Admin:</span>
                      <div className="flex justify-between">
                        <span>Username: <span className="font-mono bg-slate-200 px-1 rounded">admin</span></span>
                        <span>Password: <span className="font-mono bg-slate-200 px-1 rounded">admin123</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span>Username: <span className="font-mono bg-slate-200 px-1 rounded">kades</span></span>
                        <span>Password: <span className="font-mono bg-slate-200 px-1 rounded">kades123</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* PERSISTENT BOTTOM NAVIGATION BAR */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // reset selected item when changing tab
            setSelectedComplaint(null);
          }}
          citizenNotifCount={citizenUnreadCount}
          adminNotifCount={adminUnreadCount}
          isAdminLoggedIn={!!adminUser}
        />

      </div>
    </div>
  );
}
