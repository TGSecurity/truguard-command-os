"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";
import Link from "next/link";

interface InboxItem {
  id: string;
  type: "stuck_stage" | "callback_due";
  priority: "high" | "medium" | "low";
  title: string;
  subtitle: string;
  contact: { id: string; name: string; email: string; phone: string };
  metadata: any;
  timestamp: string;
}

export default function InboxPage() {
  const [data, setData] = useState<{ items: InboxItem[]; stuckCount: number; callbackCount: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getInbox();
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const priorityBadge = (p: string) => {
    const colors = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
    return colors[p as keyof typeof colors] || colors.low;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading inbox...</p></div>;
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total || 0} items requiring attention
          </p>
        </div>
        <button onClick={load} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
          <p className="text-sm text-amber-600">Stuck Stage</p>
          <p className="text-3xl font-bold text-amber-700">{data?.stuckCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
          <p className="text-sm text-blue-600">Callbacks Due</p>
          <p className="text-3xl font-bold text-blue-700">{data?.callbackCount || 0}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {data?.items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {item.type === "stuck_stage" ? "Stuck" : "Callback"}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                {item.contact.phone && (
                  <p className="text-xs text-gray-400 mt-1">{item.contact.phone}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Link
                  href={`/contacts/${item.contact.id}`}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  View
                </Link>
                <button
                  onClick={() => setNoteTarget({ id: item.contact.id, name: item.contact.name })}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        ))}

        {data?.items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">All clear!</p>
            <p className="text-sm">No items requiring attention right now.</p>
          </div>
        )}
      </div>

      {noteTarget && (
        <NoteModal
          contactId={noteTarget.id}
          contactName={noteTarget.name}
          onClose={() => setNoteTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
