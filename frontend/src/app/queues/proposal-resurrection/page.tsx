"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import NoteModal from "@/components/NoteModal";
import TaskModal from "@/components/TaskModal";
import TagModal from "@/components/TagModal";
import Link from "next/link";

export default function ProposalResurrectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);
  const [taskTarget, setTaskTarget] = useState<{ id: string; name: string } | null>(null);
  const [tagTarget, setTagTarget] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.getProposalResurrectionQueue()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔄 Proposal Resurrection</h1>
        <p className="text-sm text-gray-500 mt-1">
          Proposals with no activity for more than {data?.thresholdDays || 7} days
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {data?.total || 0} resurrection targets
        </span>
        <button
          onClick={load}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      {data?.total === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">No proposals need resurrection.</p>
          <p className="text-green-600 text-sm mt-1">All proposals have recent activity.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pipeline</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Days Inactive</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${item.contact_id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {item.first_name} {item.last_name}
                    </Link>
                    {item.email && (
                      <p className="text-xs text-gray-400">{item.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.pipeline_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {item.stage_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      item.days_inactive > 30 ? "text-red-600" : "text-amber-600"
                    }`}>
                      {item.days_inactive}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.monetary_value > 0
                      ? `$${Number(item.monetary_value).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNoteTarget({
                          id: item.contact_id,
                          name: `${item.first_name} ${item.last_name}`,
                        })}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Note
                      </button>
                      <button
                        onClick={() => setTaskTarget({
                          id: item.contact_id,
                          name: `${item.first_name} ${item.last_name}`,
                        })}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Task
                      </button>
                      <button
                        onClick={() => setTagTarget({
                          id: item.contact_id,
                          name: `${item.first_name} ${item.last_name}`,
                        })}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        Tag
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {noteTarget && (
        <NoteModal
          contactId={noteTarget.id}
          contactName={noteTarget.name}
          onClose={() => setNoteTarget(null)}
          onSuccess={load}
        />
      )}
      {taskTarget && (
        <TaskModal
          contactId={taskTarget.id}
          contactName={taskTarget.name}
          onClose={() => setTaskTarget(null)}
          onSuccess={load}
        />
      )}
      {tagTarget && (
        <TagModal
          contactId={tagTarget.id}
          contactName={tagTarget.name}
          onClose={() => setTagTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
