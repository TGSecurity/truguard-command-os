"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";

export default function ContactDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  const load = () => {
    setLoading(true);
    api.getContact(id as string)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading contact...</p></div>;
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;

  const { contact, notes, tasks, opportunities } = data;
  const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name || "Unknown Contact"}</h1>
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.company_name && <span>{contact.company_name}</span>}
          </div>
        </div>
        <button
          onClick={() => setShowNoteModal(true)}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Push Note to GHL
        </button>
      </div>

      {contact.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {contact.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Opportunities ({opportunities.length})</h2>
          {opportunities.length === 0 ? (
            <p className="text-sm text-gray-400">No opportunities</p>
          ) : (
            <div className="space-y-2">
              {opportunities.map((opp: any) => (
                <div key={opp.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{opp.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{opp.stage_name}</span>
                    <span className="text-xs text-green-600 font-medium">${parseFloat(opp.monetary_value || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      opp.status === "open" ? "bg-blue-100 text-blue-700" :
                      opp.status === "won" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>{opp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <div key={task.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${task.status === "completed" ? "bg-green-500" : "bg-amber-500"}`} />
                    <p className="text-sm text-gray-900">{task.title}</p>
                  </div>
                  {task.due_date && (
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Notes ({notes.length})</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note: any) => (
                <div key={note.id} className="border rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNoteModal && (
        <NoteModal
          contactId={id as string}
          contactName={name}
          onClose={() => setShowNoteModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
