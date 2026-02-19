"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";
import Link from "next/link";

export default function ContactsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.getContacts()
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total || 0} contacts synced from GHL</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Company</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.contacts?.map((c: any) => {
              const name = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unknown";
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${c.id}`} className="text-blue-600 hover:underline font-medium">
                      {name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company_name || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setNoteTarget({ id: c.id, name })}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Note
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!data?.contacts || data.contacts.length === 0) && (
          <div className="text-center py-8 text-gray-400">No contacts synced yet.</div>
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
