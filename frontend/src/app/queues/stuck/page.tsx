"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";
import Link from "next/link";

export default function StuckQueuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.getStuckQueue()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stuck Stage Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Leads stuck in their current stage for more than {data?.thresholdDays} days
          </p>
        </div>
        <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
          {data?.total || 0} stuck
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Pipeline</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Stage</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Days Stuck</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Value</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${item.contact_id}`} className="text-blue-600 hover:underline font-medium">
                    {item.first_name} {item.last_name}
                  </Link>
                  <p className="text-xs text-gray-400">{item.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.pipeline_name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                    {item.stage_name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${item.days_stuck > 14 ? "text-red-600" : "text-amber-600"}`}>
                    {item.days_stuck}d
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">${parseFloat(item.monetary_value || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setNoteTarget({
                      id: item.contact_id,
                      name: `${item.first_name} ${item.last_name}`
                    })}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Note
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items?.length === 0 && (
          <div className="text-center py-8 text-gray-400">No stuck leads right now.</div>
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
