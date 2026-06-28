import React from "react";
import { Clock, MapPin, Tag, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Complaint } from "../types";

interface ComplaintCardProps {
  key?: any;
  complaint: Complaint;
  onClick: () => void;
  isAdminView?: boolean;
}

export default function ComplaintCard({ complaint, onClick, isAdminView = false }: ComplaintCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "baru":
        return {
          label: "Baru",
          bg: "bg-slate-100 text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400"
        };
      case "dibaca":
        return {
          label: "Dibaca",
          bg: "bg-blue-50 text-blue-700",
          border: "border-blue-100",
          dot: "bg-blue-500"
        };
      case "diproses":
        return {
          label: "Diproses",
          bg: "bg-amber-50 text-amber-800",
          border: "border-amber-200",
          dot: "bg-amber-500"
        };
      case "selesai":
        return {
          label: "Selesai",
          bg: "bg-emerald-50 text-emerald-800",
          border: "border-emerald-200",
          dot: "bg-emerald-500"
        };
      case "ditolak":
        return {
          label: "Ditolak",
          bg: "bg-rose-50 text-rose-800",
          border: "border-rose-200",
          dot: "bg-rose-500"
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100 text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400"
        };
    }
  };

  const getIdentityLabel = () => {
    if (complaint.modeIdentitas === "anonim") {
      return `Anonim - ${complaint.rt}`;
    } else if (complaint.modeIdentitas === "rahasia") {
      if (isAdminView) {
        return `${complaint.nama} (Rahasia) - ${complaint.rt}`;
      } else {
        return `Warga ${complaint.rt}`;
      }
    } else {
      return `${complaint.nama} - ${complaint.rt}`;
    }
  };

  const statusConfig = getStatusConfig(complaint.status);

  // Format date
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      id={`complaint-card-${complaint.id}`}
      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-soft hover:shadow-md hover:border-emerald-100 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      {/* Spark of green highlight on active hover */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />

      {/* Header section with Ticket ID & Date */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono text-xs font-semibold text-slate-400 tracking-wider">
          {complaint.id}
        </span>
        <div className="flex items-center gap-2">
          {complaint.modeIdentitas === "rahasia" && (
            <span
              title="Identitas dirahasiakan dari publik"
              className="flex items-center p-1 rounded-full bg-blue-50 text-blue-600"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          )}
          {complaint.modeIdentitas === "terbuka" && (
            <span
              title="Identitas terbuka untuk publik"
              className="flex items-center p-1 rounded-full bg-emerald-50 text-emerald-600"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </span>
          )}
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200 line-clamp-1 mb-2">
        {complaint.judul}
      </h3>

      {/* Excerpt */}
      <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
        {complaint.isi}
      </p>

      {/* Footer Info */}
      <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            {getIdentityLabel()}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-300" />
            {complaint.kategori}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition-colors duration-200 ml-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(complaint.tanggal)}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
