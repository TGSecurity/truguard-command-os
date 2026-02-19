"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    try {
      const [s, ss] = await Promise.all([api.getSettings(), api.getSyncStatus()]);
      setSettings(s);
      setSyncStatus(ss);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await api.updateSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch {}
    setSaving(null);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await api.triggerSync();
      await load();
    } catch {}
    setSyncing(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stuck Stage Threshold (Days)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={settings.stuck_threshold_days || "7"}
            onChange={(e) => setSettings((prev) => ({ ...prev, stuck_threshold_days: e.target.value }))}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            min={1}
          />
          <button
            onClick={() => updateSetting("stuck_threshold_days", settings.stuck_threshold_days)}
            disabled={saving === "stuck_threshold_days"}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving === "stuck_threshold_days" ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Leads stuck in a stage longer than this will appear in the Stuck Stage queue.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Kill Switch</p>
            <p className="text-xs text-gray-500 mt-1">
              Immediately stops all GHL writes and sync when enabled.
            </p>
          </div>
          <button
            onClick={() => updateSetting("kill_switch", settings.kill_switch === "on" ? "off" : "on")}
            disabled={saving === "kill_switch"}
            className={`px-6 py-2 text-sm rounded-lg font-medium ${
              settings.kill_switch === "on"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {settings.kill_switch === "on" ? "ACTIVE - Click to Disable" : "OFF"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Manual GHL Sync</p>
            <p className="text-xs text-gray-500 mt-1">Trigger a full sync now.</p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Sync Status</h2>
        <div className="space-y-2">
          {syncStatus.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-700 capitalize">{s.entity}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{s.records_synced} records</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  s.status === "idle" ? "bg-green-100 text-green-700" :
                  s.status === "running" ? "bg-blue-100 text-blue-700" :
                  "bg-red-100 text-red-700"
                }`}>{s.status}</span>
                {s.last_synced_at && (
                  <span className="text-xs text-gray-400">
                    {new Date(s.last_synced_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
