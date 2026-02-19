"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLog()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Target</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">{item.action}</td>
                <td className="px-4 py-3 text-gray-500">
                  {item.target_type}{item.target_id ? ` / ${item.target_id.slice(0, 8)}...` : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.status === "approved" ? "bg-green-100 text-green-700" :
                    item.status === "error" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.approved_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.items || data.items.length === 0) && (
          <div className="text-center py-8 text-gray-400">No audit entries yet.</div>
        )}
      </div>
    </div>
  );
}
