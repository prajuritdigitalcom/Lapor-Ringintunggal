import React from "react";
import { ListTodo, CheckCircle2, Loader2, AlertCircle, FileSpreadsheet, Eye } from "lucide-react";
import { VillageStats } from "../types";

interface StatsCardProps {
  stats: VillageStats;
  onFilterClick: (status: string) => void;
}

export default function StatsCard({ stats, onFilterClick }: StatsCardProps) {
  const cardItems = [
    {
      id: "semua",
      title: "Total Laporan",
      count: stats.total,
      color: "bg-slate-500",
      textColor: "text-slate-700",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
      icon: FileSpreadsheet,
    },
    {
      id: "baru",
      title: "Laporan Baru",
      count: stats.baru,
      color: "bg-zinc-400",
      textColor: "text-zinc-600",
      bgColor: "bg-zinc-50",
      borderColor: "border-zinc-100",
      icon: ListTodo,
    },
    {
      id: "dibaca",
      title: "Laporan Dibaca",
      count: stats.dibaca,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50/50",
      borderColor: "border-blue-100",
      icon: Eye,
    },
    {
      id: "diproses",
      title: "Sedang Diproses",
      count: stats.diproses,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50/50",
      borderColor: "border-amber-100",
      icon: Loader2,
      animate: "animate-spin",
    },
    {
      id: "selesai",
      title: "Laporan Selesai",
      count: stats.selesai,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50/40",
      borderColor: "border-emerald-100",
      icon: CheckCircle2,
    },
    {
      id: "ditolak",
      title: "Laporan Ditolak",
      count: stats.ditolak,
      color: "bg-rose-500",
      textColor: "text-rose-600",
      bgColor: "bg-rose-50/30",
      borderColor: "border-rose-100",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {cardItems.map((card) => {
        const IconComponent = card.icon;
        return (
          <button
            key={card.id}
            id={`stats-card-${card.id}`}
            onClick={() => onFilterClick(card.id)}
            className={`flex flex-col text-left p-4 rounded-3xl border ${card.bgColor} ${card.borderColor} shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer`}
          >
            {/* Visual background ripple on hover */}
            <div className="absolute inset-0 bg-white/40 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl origin-bottom-right" />

            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-medium text-slate-500 tracking-tight leading-tight">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-xl ${card.textColor} bg-white shadow-sm`}>
                <IconComponent className={`w-4 h-4 ${card.id === "diproses" ? "group-hover:animate-spin" : ""}`} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline z-10">
              <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
                {card.count}
              </span>
              <span className="text-[10px] ml-1 text-slate-400 font-normal">laporan</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </button>
        );
      })}
    </div>
  );
}
