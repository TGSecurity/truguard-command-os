const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Inbox
  getInbox: () => request<any>("/inbox"),

  // Board
  getBoard: () => request<any>("/board"),

  // Queues
  getStuckQueue: (days?: number) =>
    request<any>(`/queues/stuck${days ? `?days=${days}` : ""}`),
  getCallbackQueue: () => request<any>("/queues/callbacks"),

  // Contacts
  getContact: (id: string) => request<any>(`/contacts/${id}`),
  getContacts: (page?: number) =>
    request<any>(`/contacts?page=${page || 1}`),

  // Actions
  approveNote: (contactId: string, body: string) =>
    request<any>("/actions/approve-note", {
      method: "POST",
      body: JSON.stringify({ contactId, body }),
    }),

  // Settings
  getSettings: () => request<any>("/settings"),
  updateSetting: (key: string, value: string) =>
    request<any>(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  getSyncStatus: () => request<any>("/settings/sync-status"),

  // Audit
  getAuditLog: (limit?: number) =>
    request<any>(`/audit?limit=${limit || 50}`),

  // Sync
  triggerSync: () =>
    request<any>("/sync/trigger", { method: "POST" }),

  // Tom — AI Chief of Staff
  tomDailyBrief: () =>
    request<any>("/tom/daily-brief", { method: "POST" }),
  tomFollowUp: () =>
    request<any>("/tom/follow-up", { method: "POST" }),
  tomWbr: (body: { wage: number; billRate: number; weeklyHours?: number; contractType?: string; overtime?: boolean }) =>
    request<any>("/tom/wbr", { method: "POST", body: JSON.stringify(body) }),
  tomChat: (message: string) =>
    request<any>("/tom/chat", { method: "POST", body: JSON.stringify({ message }) }),
};
