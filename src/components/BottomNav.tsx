import React from "react";
import { Home, PlusCircle, FileText, Bell, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  citizenNotifCount: number;
  adminNotifCount: number;
  isAdminLoggedIn: boolean;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  citizenNotifCount,
  adminNotifCount,
  isAdminLoggedIn,
}: BottomNavProps) {
  const notifCount = isAdminLoggedIn ? adminNotifCount : citizenNotifCount;

  const navItems = [
    { id: "beranda", label: "Beranda", icon: Home },
    { id: "buat-laporan", label: "Lapor", icon: PlusCircle },
    { id: "pengaduan", label: "Aduan", icon: FileText },
    { id: "notifikasi", label: "Notifikasi", icon: Bell, badge: notifCount },
    { id: "profil", label: isAdminLoggedIn ? "Admin" : "Profil", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-lg px-2 py-1 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      <nav className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-300 rounded-xl ${
                isActive
                  ? "text-emerald-600 scale-105 font-medium"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? "bg-emerald-50 text-emerald-600" : ""
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                  {item.badge}
                </span>
              ) : null}

              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
