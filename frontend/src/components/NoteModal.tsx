"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface NoteModalProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NoteModal({ contactId, contactName, onClose, onSuccess }: NoteModalProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!body.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.approveNote(contactId, body);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Push Note to GHL</h2>
        <p className="text-sm text-gray-500 mb-4">
          Contact: <span className="font-medium text-gray-700">{contactName}</span>
        </p>

        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={5}
          placeholder="Type your note here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoFocus
        />

        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-amber-600 font-medium">
            This will write to GHL after approval
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || !body.trim()}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Pushing..." : "Approve & Push Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
