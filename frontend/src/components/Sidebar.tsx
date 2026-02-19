"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Inbox", icon: "📥" },
  { href: "/board", label: "Board", icon: "📋" },
  { href: "/queues/stuck", label: "Stuck Stage", icon: "⚠️" },
  { href: "/queues/callbacks", label: "Callbacks Due", icon: "📞" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/audit", label: "Audit Log", icon: "📜" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">TruGuard</h1>
        <p className="text-xs text-gray-400 mt-1">Command Center</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">TruGuard Command OS v1.0</p>
      </div>
    </aside>
  );
}
