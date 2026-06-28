import React from "react";
import { Check, Eye, HelpCircle, Flame, CheckCircle2, XCircle } from "lucide-react";
import { Complaint } from "../types";

interface TimelineViewProps {
  complaint: Complaint;
}

export default function TimelineView({ complaint }: TimelineViewProps) {
  // Generate realistic events based on the complaint's current status and timestamps
  const getEvents = () => {
    const events = [];
    const tCreate = new Date(complaint.tanggal);
    
    // Event 1: Created
    events.push({
      id: "ev-create",
      title: "Laporan Diterima",
      description: "Sistem berhasil membuat nomor tiket dan mendistribusikan laporan ke antrean operator desa.",
      date: tCreate,
      active: true,
      icon: HelpCircle,
      color: "bg-slate-500",
    });

    // Event 2: Read
    const hasRead = ["dibaca", "diproses", "selesai", "ditolak"].includes(complaint.status);
    const tRead = new Date(tCreate.getTime() + 45 * 60000); // Simulated read 45m later, or use updatedAt
    events.push({
      id: "ev-read",
      title: "Dibaca oleh Admin",
      description: "Operator desa telah memeriksa kelengkapan isi laporan dan mendaftarkannya pada basis tindak lanjut.",
      date: hasRead ? (complaint.status === "dibaca" ? new Date(complaint.tanggalUpdate) : tRead) : null,
      active: hasRead,
      icon: Eye,
      color: "bg-blue-500",
    });

    // Event 3: In Process
    const hasProcess = ["diproses", "selesai"].includes(complaint.status);
    events.push({
      id: "ev-process",
      title: "Mulai Ditindaklanjuti",
      description: "Perangkat Desa dan dinas terkait sedang menangani aduan di lapangan sesuai dengan skala prioritas.",
      date: hasProcess ? (complaint.status === "diproses" ? new Date(complaint.tanggalUpdate) : new Date(tCreate.getTime() + 4 * 3600000)) : null,
      active: hasProcess,
      icon: Flame,
      color: "bg-amber-500",
    });

    // Event 4: Resolved or Rejected
    const isFinished = complaint.status === "selesai";
    const isRejected = complaint.status === "ditolak";

    if (isRejected) {
      events.push({
        id: "ev-reject",
        title: "Laporan Ditolak",
        description: `Pengaduan tidak dapat ditindaklanjuti. Alasan: ${complaint.alasanDitolak || "-"}`,
        date: new Date(complaint.tanggalUpdate),
        active: true,
        icon: XCircle,
        color: "bg-rose-500",
      });
    } else {
      events.push({
        id: "ev-done",
        title: "Pekerjaan Selesai",
        description: "Kendala telah teratasi di lapangan. Terima kasih banyak atas partisipasi Anda membangun desa!",
        date: isFinished ? new Date(complaint.tanggalUpdate) : null,
        active: isFinished,
        icon: CheckCircle2,
        color: "bg-emerald-500",
      });
    }

    return events;
  };

  const events = getEvents();

  // Helper to format date
  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + " • " + date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  };

  return (
    <div className="relative py-4 pl-4 pr-1">
      {/* Timeline core vertical bar line */}
      <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-slate-100" />

      <div className="space-y-8">
        {events.map((event, index) => {
          const IconComp = event.icon;
          const isDone = event.active;

          return (
            <div key={event.id} className="relative flex items-start group">
              {/* Timeline bubble bullet indicator */}
              <div className="relative z-10 flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? `${event.color} border-white shadow-md text-white scale-110`
                      : "bg-white border-slate-100 text-slate-300"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card info contents */}
              <div className="flex-1 ml-4 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h4
                    className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                      isDone ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {event.title}
                  </h4>
                  {event.date && (
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      {formatDateTime(event.date)}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs mt-1 leading-relaxed transition-colors duration-300 ${
                    isDone ? "text-slate-500 font-medium" : "text-slate-400/70"
                  }`}
                >
                  {event.description}
                </p>

                {/* Sub-asset display inside timeline: Before/After Photos for Finished status */}
                {event.id === "ev-done" && isDone && (complaint.fotoBefore || complaint.fotoAfter) && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {complaint.fotoBefore && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                        <span className="block text-[9px] font-bold bg-slate-100 text-slate-500 py-0.5 px-2 text-center uppercase tracking-wider">
                          Sebelum Perbaikan
                        </span>
                        <img
                          src={complaint.fotoBefore}
                          alt="Sebelum"
                          referrerPolicy="no-referrer"
                          className="w-full h-24 object-cover object-center"
                        />
                      </div>
                    )}
                    {complaint.fotoAfter && (
                      <div className="rounded-2xl overflow-hidden border border-emerald-100 bg-emerald-50">
                        <span className="block text-[9px] font-bold bg-emerald-100 text-emerald-700 py-0.5 px-2 text-center uppercase tracking-wider">
                          Sesudah Perbaikan
                        </span>
                        <img
                          src={complaint.fotoAfter}
                          alt="Sesudah"
                          referrerPolicy="no-referrer"
                          className="w-full h-24 object-cover object-center"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
