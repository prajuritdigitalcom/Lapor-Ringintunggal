import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart2,
  Users,
  MessageSquare,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Lock,
  Camera,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle,
  XCircle,
  UserX,
  RefreshCw,
} from "lucide-react";
import { Complaint, AdminUser, VillageStats } from "../types";

interface AdminPanelProps {
  adminUser: { id: string; nama: string; username: string; role: string } | null;
  onLogout: () => void;
  allComplaints: Complaint[];
  setAllComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
  fetchStats: () => void;
  fetchComplaints: () => void;
}

export default function AdminPanel({
  adminUser,
  onLogout,
  allComplaints,
  setAllComplaints,
  fetchStats,
  fetchComplaints,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ringkasan" | "laporan" | "kelola-admin">("ringkasan");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [statusDraft, setStatusDraft] = useState<any>("");
  const [reasonDitolakDraft, setReasonDitolakDraft] = useState("");
  const [fotoAfterDraft, setFotoAfterDraft] = useState<string | null>(null);
  
  // Admin CRUD states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
    nama: "",
    role: "operator" as any,
  });
  const [crudError, setCrudError] = useState("");
  const [crudSuccess, setCrudSuccess] = useState("");

  // Filter complaints in admin list
  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("semua");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("semua");

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Fetch conversations when selected complaint changes
  useEffect(() => {
    if (selectedComplaint) {
      fetch(`/api/pengaduan/${selectedComplaint.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.item) {
            setSelectedComplaint(data.item);
            setChats(data.percakapan);
            setStatusDraft(data.item.status);
            setReasonDitolakDraft(data.item.alasanDitolak || "");
            setFotoAfterDraft(data.item.fotoAfter || null);
          }
        });
    }
  }, [selectedComplaint?.id]);

  // Handle status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (statusDraft === "ditolak" && !reasonDitolakDraft.trim()) {
      alert("Harap masukkan alasan penolakan laporan.");
      return;
    }

    try {
      const res = await fetch(`/api/pengaduan/${selectedComplaint.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusDraft,
          alasanDitolak: statusDraft === "ditolak" ? reasonDitolakDraft : undefined,
          fotoAfter: statusDraft === "selesai" ? fotoAfterDraft : undefined,
          catatanAdmin: `Diupdate oleh ${adminUser?.nama}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedComplaint(data.complaint);
        // Refresh master lists
        fetchComplaints();
        fetchStats();
        alert("Status aduan berhasil diperbarui!");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui status.");
    }
  };

  // Convert image to base64
  const handleAfterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoAfterDraft(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !chatInput.trim()) return;

    try {
      const res = await fetch(`/api/pengaduan/${selectedComplaint.id}/percakapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengirim: "admin",
          namaPengirim: adminUser?.nama || "Admin Desa",
          pesan: chatInput,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChats([...chats, newMsg]);
        setChatInput("");
        // Automatically check read/unread notifications or reload
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin CRUD actions
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");

    if (!adminForm.username || !adminForm.nama) {
      setCrudError("Mohon lengkapi seluruh field.");
      return;
    }

    if (!editingAdmin && !adminForm.password) {
      setCrudError("Password wajib diisi untuk admin baru.");
      return;
    }

    try {
      let res;
      if (editingAdmin) {
        // Edit existing
        res = await fetch(`/api/admins/${editingAdmin.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: adminForm.nama,
            role: adminForm.role,
            password: adminForm.password || undefined, // empty leaves as is
          }),
        });
      } else {
        // Create new
        res = await fetch("/api/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: adminForm.username,
            password: adminForm.password,
            nama: adminForm.nama,
            role: adminForm.role,
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setCrudSuccess(editingAdmin ? "Admin berhasil diperbarui!" : "Admin baru berhasil ditambahkan!");
        fetchAdmins();
        setTimeout(() => {
          setShowAdminModal(false);
          setEditingAdmin(null);
          setAdminForm({ username: "", password: "", nama: "", role: "operator" });
          setCrudSuccess("");
        }, 1200);
      } else {
        setCrudError(data.error || "Gagal menyimpan data admin.");
      }
    } catch (err) {
      setCrudError("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus admin ini dari sistem?")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("Admin berhasil dihapus.");
        fetchAdmins();
      } else {
        alert(data.error || "Gagal menghapus admin.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    }
  };

  // Compile stats for charts
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

  const categoryCounts = categories.map((cat) => {
    return {
      name: cat,
      count: allComplaints.filter((c) => c.kategori === cat).length,
    };
  }).filter((c) => c.count > 0);

  // Status statistics
  const statusStats = {
    baru: allComplaints.filter((c) => c.status === "baru").length,
    dibaca: allComplaints.filter((c) => c.status === "dibaca").length,
    diproses: allComplaints.filter((c) => c.status === "diproses").length,
    selesai: allComplaints.filter((c) => c.status === "selesai").length,
    ditolak: allComplaints.filter((c) => c.status === "ditolak").length,
  };

  // Filter list of complaints for management table
  const filteredComplaintsForAdmin = allComplaints.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      c.judul.toLowerCase().includes(adminSearch.toLowerCase()) ||
      c.rt.toLowerCase().includes(adminSearch.toLowerCase());
    const matchStatus = adminStatusFilter === "semua" || c.status === adminStatusFilter;
    const matchCategory = adminCategoryFilter === "semua" || c.kategori === adminCategoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="pb-10">
      {/* Header Profile Info Bar */}
      <div className="bg-emerald-900 text-white p-6 rounded-t-3xl -mx-4 -mt-4 shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {adminUser?.role === "kepala_desa" ? "Kepala Desa" : "Operator Admin"}
          </span>
          <h2 className="text-xl font-bold font-display mt-1">{adminUser?.nama}</h2>
          <p className="text-[11px] text-emerald-200/80 mt-0.5">Kelurahan Desa Ringintunggal • Bojonegoro</p>
        </div>
        <button
          onClick={onLogout}
          id="btn-logout-admin"
          className="bg-emerald-850 hover:bg-emerald-800 border border-emerald-700/50 text-emerald-100 text-xs font-semibold px-4 py-2 rounded-2xl transition-all duration-300"
        >
          Keluar
        </button>
      </div>

      {/* Admin Subtabs Menu Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-5 gap-1 shadow-inner">
        <button
          onClick={() => {
            setActiveSubTab("ringkasan");
            setSelectedComplaint(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === "ringkasan"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Ringkasan
        </button>
        <button
          onClick={() => {
            setActiveSubTab("laporan");
            setSelectedComplaint(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === "laporan"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Kelola Aduan ({allComplaints.length})
        </button>
        {adminUser?.role === "kepala_desa" && (
          <button
            onClick={() => {
              setActiveSubTab("kelola-admin");
              setSelectedComplaint(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeSubTab === "kelola-admin"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Kelola Admin
          </button>
        )}
      </div>

      {/* TAB 1: RINGKASAN & GRAPHICS */}
      {activeSubTab === "ringkasan" && (
        <div className="mt-5 space-y-6 animate-fade-in">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Baru", count: statusStats.baru, bg: "bg-slate-100", text: "text-slate-700" },
              { label: "Dibaca", count: statusStats.dibaca, bg: "bg-blue-50", text: "text-blue-700" },
              { label: "Diproses", count: statusStats.diproses, bg: "bg-amber-50", text: "text-amber-700" },
              { label: "Selesai", count: statusStats.selesai, bg: "bg-emerald-50", text: "text-emerald-700" },
              { label: "Ditolak", count: statusStats.ditolak, bg: "bg-rose-50", text: "text-rose-700" },
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-3.5 rounded-2xl border border-transparent shadow-soft flex flex-col justify-between`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</span>
                <span className={`text-2xl font-black font-display ${stat.text} mt-1`}>{stat.count}</span>
              </div>
            ))}
          </div>

          {/* Premium Custom Draw SVG Charts: Category Breakdown */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4 font-display">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Statistik Kategori Laporan Aktif
            </h3>

            {categoryCounts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Belum ada data kategori untuk digambarkan.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryCounts.map((item, index) => {
                  const maxCount = Math.max(...categoryCounts.map((c) => c.count));
                  const percent = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="text-slate-900">{item.count} laporan</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom SVG Line Chart for Monthly Trends */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 font-display">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Trend Laporan 4 Bulan Terakhir
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Total kumulatif volume keluhan warga Ringintunggal</p>

            {/* Custom SVG line trend */}
            <div className="relative pt-2">
              <svg viewBox="0 0 400 120" className="w-full overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#f8fafc" strokeWidth="2" strokeDasharray="3,3" />

                {/* Trend line paths */}
                <path
                  d="M 20,95 Q 110,65 200,75 T 380,25"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 20,95 Q 110,65 200,75 T 380,25"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Nodes dots */}
                <circle cx="20" cy="95" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="110" cy="73" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="200" cy="75" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="380" cy="25" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />

                {/* Labels */}
                <text x="20" y="115" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="bold">Mar</text>
                <text x="110" y="115" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="bold">Apr</text>
                <text x="200" y="115" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="bold">Mei</text>
                <text x="380" y="115" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="bold">Jun</text>

                {/* Values labels */}
                <text x="20" y="85" fontSize="8" fill="#475569" fontWeight="bold" textAnchor="middle">12 aduan</text>
                <text x="110" y="62" fontSize="8" fill="#475569" fontWeight="bold" textAnchor="middle">24 aduan</text>
                <text x="200" y="65" fontSize="8" fill="#475569" fontWeight="bold" textAnchor="middle">28 aduan</text>
                <text x="380" y="15" fontSize="8" fill="#047857" fontWeight="bold" textAnchor="middle">45 aduan</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA PENGADUAN LIST */}
      {activeSubTab === "laporan" && !selectedComplaint && (
        <div className="mt-5 space-y-4 animate-fade-in">
          {/* Controls Box */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari Tiket, Judul, atau RT..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Filter Status</label>
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
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
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Kategori</label>
                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="semua">Semua Kategori</option>
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table list of complaints */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Daftar Pengaduan ({filteredComplaintsForAdmin.length})
              </h3>
              <button onClick={fetchComplaints} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredComplaintsForAdmin.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada laporan warga yang cocok dengan kriteria filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredComplaintsForAdmin.map((c) => {
                  const labelColors: Record<string, string> = {
                    baru: "bg-slate-100 text-slate-700",
                    dibaca: "bg-blue-50 text-blue-700",
                    diproses: "bg-amber-50 text-amber-700",
                    selesai: "bg-emerald-50 text-emerald-700",
                    ditolak: "bg-rose-50 text-rose-700",
                  };

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{c.id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${labelColors[c.status] || "bg-slate-100"}`}>
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{c.judul}</h4>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>{c.modeIdentitas === "anonim" ? `Anonim (${c.rt})` : `${c.nama || "Warga"} (${c.rt})`}</span>
                          <span>{new Date(c.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-DETAIL REVIEW MODE FOR ONE COMPLAINT */}
      {activeSubTab === "laporan" && selectedComplaint && (
        <div className="mt-5 space-y-5 animate-fade-in">
          {/* Back button */}
          <button
            onClick={() => setSelectedComplaint(null)}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 gap-1"
          >
            <X className="w-4 h-4" />
            Tutup & Kembali ke Daftar
          </button>

          {/* Details Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-400 font-bold block">{selectedComplaint.id}</span>
                <span className="text-[10px] text-slate-400">{new Date(selectedComplaint.tanggal).toLocaleString("id-ID")}</span>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                selectedComplaint.status === "selesai" ? "bg-emerald-100 text-emerald-800" :
                selectedComplaint.status === "diproses" ? "bg-amber-100 text-amber-800" :
                selectedComplaint.status === "ditolak" ? "bg-rose-100 text-rose-800" :
                selectedComplaint.status === "dibaca" ? "bg-blue-100 text-blue-800" :
                "bg-slate-100 text-slate-800"
              }`}>
                {selectedComplaint.status}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Kategori & Lokasi</span>
              <p className="text-xs text-slate-800 font-semibold">{selectedComplaint.kategori} • {selectedComplaint.rt}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Pelapor (Sesuai Mode Privasi)</span>
              <p className="text-xs text-slate-800 font-semibold">
                {selectedComplaint.modeIdentitas === "anonim" && "🔒 Anonim Penuh (Identitas tidak diketahui siapa pun)"}
                {selectedComplaint.modeIdentitas === "rahasia" && `👁️ Identitas Rahasia (Hanya Admin yang Tahu): ${selectedComplaint.nama} (${selectedComplaint.nomorWhatsapp})`}
                {selectedComplaint.modeIdentitas === "terbuka" && `👥 Terbuka Publik: ${selectedComplaint.nama} (${selectedComplaint.nomorWhatsapp})`}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">{selectedComplaint.judul}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">{selectedComplaint.isi}</p>
            </div>

            {selectedComplaint.fotoBefore && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Lampiran Foto Warga</span>
                <img
                  src={selectedComplaint.fotoBefore}
                  alt="Lampiran Before"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-48 object-cover rounded-2xl border border-slate-100"
                />
              </div>
            )}
          </div>

          {/* Action Status Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Tindak Lanjut & Update Status</h3>
            
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Ubah Status</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                  {["dibaca", "diproses", "selesai", "ditolak"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusDraft(st)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all duration-300 ${
                        statusDraft === st
                          ? st === "selesai" ? "bg-emerald-600 text-white" :
                            st === "ditolak" ? "bg-rose-600 text-white" :
                            st === "diproses" ? "bg-amber-500 text-white" :
                            "bg-blue-600 text-white"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional parameters based on chosen status */}
              {statusDraft === "ditolak" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Alasan Penolakan (Wajib)</label>
                  <textarea
                    required
                    value={reasonDitolakDraft}
                    onChange={(e) => setReasonDitolakDraft(e.target.value)}
                    placeholder="Contoh: Lokasi aduan berada di luar wilayah administratif Desa Ringintunggal."
                    className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl p-2.5 h-16 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {statusDraft === "selesai" && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Foto Bukti Tindak Lanjut (Sebelum & Sesudah)</label>
                  <div className="flex gap-3 items-center">
                    {fotoAfterDraft ? (
                      <div className="relative">
                        <img
                          src={fotoAfterDraft}
                          alt="After draft"
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-cover rounded-xl border border-emerald-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFotoAfterDraft(null)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl p-5 w-20 h-20 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Selesai</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAfterPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <span className="text-[10px] text-slate-400">
                      Opsional. Unggah foto setelah pengerjaan selesai untuk memberi rasa puas kepada pelapor.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-soft hover:bg-emerald-700 hover:shadow transition-all duration-300"
              >
                Simpan & Update Progres
              </button>
            </form>
          </div>

          {/* Two-Way Conversation Board */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Komunikasi Dua Arah</h3>

            {/* Chat list */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {chats.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Belum ada pesan obrolan dalam aduan ini. Tulis pesan di bawah untuk memulai.
                </div>
              ) : (
                chats.map((chat) => {
                  const isAdmin = chat.pengirim === "admin";
                  return (
                    <div
                      key={chat.id}
                      className={`flex flex-col max-w-[85%] ${
                        isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <span className="text-[9px] text-slate-400 font-bold mb-0.5">{chat.namaPengirim}</span>
                      <div
                        className={`p-3 rounded-2xl text-xs ${
                          isAdmin
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-slate-100 text-slate-800 rounded-tl-none"
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

            {/* Input message form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                placeholder="Balas laporan warga ini..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors duration-200"
              >
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA ADMINS (Kepala Desa Only) */}
      {activeSubTab === "kelola-admin" && adminUser?.role === "kepala_desa" && (
        <div className="mt-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-soft">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Kelola Akun Perangkat</h3>
              <p className="text-[10px] text-slate-400">Total admin terdaftar pada database desa</p>
            </div>
            <button
              onClick={() => {
                setEditingAdmin(null);
                setAdminForm({ username: "", password: "", nama: "", role: "operator" });
                setCrudError("");
                setCrudSuccess("");
                setShowAdminModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-soft"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Admin
            </button>
          </div>

          {/* Admin Cards Grid */}
          <div className="grid grid-cols-1 gap-3">
            {admins.map((adm) => (
              <div key={adm.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{adm.nama}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                    <span className="bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono uppercase">
                      @{adm.username}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                      {adm.role === "operator" ? "Operator" : adm.role === "perangkat" ? "Perangkat" : adm.role}
                    </span>
                  </div>
                </div>

                {/* CRUD button actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingAdmin(adm);
                      setAdminForm({
                        username: adm.username,
                        password: "", // hide pass
                        nama: adm.nama,
                        role: adm.role,
                      });
                      setCrudError("");
                      setCrudSuccess("");
                      setShowAdminModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(adm.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN EDIT/CREATE MODAL DIALOG */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-sm shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold font-display text-slate-900 mb-4">
              {editingAdmin ? "Edit Perangkat Desa" : "Tambah Perangkat Baru"}
            </h3>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Samsul Hadi"
                  value={adminForm.nama}
                  onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Username Login</label>
                <input
                  type="text"
                  required
                  disabled={!!editingAdmin}
                  placeholder="Contoh: samsul_operator"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase() })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">
                  {editingAdmin ? "Password Baru (Kosongkan jika tidak diganti)" : "Password Login"}
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password..."
                  required={!editingAdmin}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Peran / Jabatan</label>
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="operator">Operator Desa</option>
                  <option value="perangkat">Perangkat Desa</option>
                  <option value="kepala_desa">Kepala Desa</option>
                </select>
              </div>

              {crudError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-medium">
                  {crudError}
                </div>
              )}

              {crudSuccess && (
                <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-medium">
                  {crudSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2 border border-slate-150 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-soft"
                >
                  {editingAdmin ? "Update" : "Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
