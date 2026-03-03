"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface TagModalProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_TAGS = [
  "Follow-Up",
  "Hot Lead",
  "Proposal Sent",
  "Resurrection Target",
  "Do Not Call",
  "Apartment",
  "Logistics",
  "Hotel",
];

export default function TagModal({ contactId, contactName, onClose, onSuccess }: TagModalProps) {
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!tagName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.approveTagAdd(contactId, tagName.trim());
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add Tag in GHL</h2>
        <p className="text-sm text-gray-500 mb-4">
          Contact: <span className="font-medium">{contactName}</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tag Name *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter tag name..."
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Common tags:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagName(tag)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  tagName === tag
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-amber-600 font-medium">This will add a tag in GHL</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || !tagName.trim()}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Approve & Add Tag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
