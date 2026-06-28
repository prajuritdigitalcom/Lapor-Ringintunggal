export interface Complaint {
  id: string; // Format LR-YYYYMMDD-XXXX
  tanggal: string; // ISO String
  modeIdentitas: 'anonim' | 'rahasia' | 'terbuka';
  nama?: string;
  nomorWhatsapp?: string;
  rt: string;
  kategori: string;
  judul: string;
  isi: string;
  fotoBefore?: string; // Base64 dataURL
  fotoAfter?: string; // Base64 dataURL
  status: 'baru' | 'dibaca' | 'diproses' | 'selesai' | 'ditolak';
  alasanDitolak?: string;
  rating?: 'sangat_puas' | 'puas' | 'cukup_puas' | 'tidak_puas';
  ratingKomentar?: string;
  tanggalUpdate: string;
}

export interface ConversationMessage {
  id: string;
  idPengaduan: string;
  pengirim: 'warga' | 'admin';
  namaPengirim: string;
  pesan: string;
  tanggal: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string; // In our demo we can check plain text or hash
  nama: string;
  role: 'admin' | 'operator' | 'perangkat' | 'kepala_desa';
}

export interface Notification {
  id: string;
  target: 'admin' | 'warga';
  idPengaduan: string;
  judul: string;
  pesan: string;
  tanggal: string;
  dibaca: boolean;
}

export interface VillageStats {
  total: number;
  baru: number;
  dibaca: number;
  diproses: number;
  selesai: number;
  ditolak: number;
}
