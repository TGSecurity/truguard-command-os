"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";
import Link from "next/link";

export default function CallbackQueuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.getCallbackQueue()
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
          <h1 className="text-2xl font-bold text-gray-900">Callbacks Due</h1>
          <p className="text-sm text-gray-500 mt-1">Overdue tasks that need follow-up</p>
        </div>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
          {data?.total || 0} overdue
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Task</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Due Date</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Overdue</th>
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
                <td className="px-4 py-3 text-gray-700">{item.title}</td>
                <td className="px-4 py-3 text-gray-500">
                  {item.due_date ? new Date(item.due_date).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${item.days_overdue > 3 ? "text-red-600" : "text-amber-600"}`}>
                    {item.days_overdue}d
                  </span>
                </td>
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
          <div className="text-center py-8 text-gray-400">No overdue callbacks.</div>
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
