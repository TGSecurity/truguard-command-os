"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type AgentType = "daily-brief" | "follow-up" | "wbr" | "chat";

export default function TomPage() {
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // WBR inputs
  const [wage, setWage] = useState("");
  const [billRate, setBillRate] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("40");
  const [contractType, setContractType] = useState("permanent");
  const [overtime, setOvertime] = useState(false);
  const [wbrMetrics, setWbrMetrics] = useState<any>(null);

  // Chat input
  const [chatMessage, setChatMessage] = useState("");

  const runAgent = async (agent: AgentType) => {
    setActiveAgent(agent);
    setLoading(true);
    setError("");
    setResponse("");
    setWbrMetrics(null);

    try {
      let result: any;

      if (agent === "daily-brief") {
        result = await api.tomDailyBrief();
      } else if (agent === "follow-up") {
        result = await api.tomFollowUp();
      } else if (agent === "wbr") {
        result = await api.tomWbr({ wage: parseFloat(wage), billRate: parseFloat(billRate), weeklyHours: parseFloat(weeklyHours), contractType, overtime });
        if (result.metrics) setWbrMetrics(result.metrics);
      } else if (agent === "chat") {
        result = await api.tomChat(chatMessage);
      }

      setResponse(result.response || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) =>
    s === "GREEN" ? "text-green-600 bg-green-50" :
    s === "YELLOW" ? "text-yellow-600 bg-yellow-50" :
    "text-red-600 bg-red-50";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tom — AI Chief of Staff</h1>
        <p className="text-sm text-gray-500 mt-1">Powered by GPT-5.2. All actions require your approval before writing to GHL.</p>
      </div>

      {/* Agent buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => runAgent("daily-brief")}
          disabled={loading}
          className="bg-white border rounded-xl p-4 text-left hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <p className="text-lg">📋</p>
          <p className="font-semibold text-gray-900 mt-1">Daily Brief</p>
          <p className="text-xs text-gray-500 mt-1">Morning briefing — top priorities for today</p>
        </button>

        <button
          onClick={() => runAgent("follow-up")}
          disabled={loading}
          className="bg-white border rounded-xl p-4 text-left hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <p className="text-lg">⚠️</p>
          <p className="font-semibold text-gray-900 mt-1">Follow-Up Governor</p>
          <p className="text-xs text-gray-500 mt-1">Stuck deals, resurrection targets, overdue callbacks</p>
        </button>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-lg">💰</p>
          <p className="font-semibold text-gray-900 mt-1">WBR Engine</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Margin calculator — check before sending proposal</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-500">Guard Wage ($/hr)</label>
              <input type="number" value={wage} onChange={e => setWage(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm mt-1" placeholder="18.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Bill Rate ($/hr)</label>
              <input type="number" value={billRate} onChange={e => setBillRate(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm mt-1" placeholder="27.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Weekly Hours</label>
              <input type="number" value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Contract Type</label>
              <select value={contractType} onChange={e => setContractType(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm mt-1">
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <input type="checkbox" checked={overtime} onChange={e => setOvertime(e.target.checked)} />
            Overtime expected
          </label>
          <button
            onClick={() => runAgent("wbr")}
            disabled={loading || !wage || !billRate}
            className="w-full py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Calculate Margin
          </button>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-lg">💬</p>
          <p className="font-semibold text-gray-900 mt-1">Ask Tom</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Ask anything about your pipeline or operations</p>
          <textarea
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            rows={3}
            placeholder="e.g. What should I focus on today?"
            className="w-full border rounded px-2 py-1 text-sm resize-none mb-2"
          />
          <button
            onClick={() => runAgent("chat")}
            disabled={loading || !chatMessage.trim()}
            className="w-full py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
          >
            Ask Tom
          </button>
        </div>
      </div>

      {/* WBR Metrics */}
      {wbrMetrics && (
        <div className={`rounded-xl p-4 mb-4 border ${statusColor(wbrMetrics.status)}`}>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs opacity-70">WBR</p>
              <p className="text-2xl font-bold">{wbrMetrics.wbr}%</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Margin</p>
              <p className="text-2xl font-bold">{wbrMetrics.margin}%</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Monthly Revenue</p>
              <p className="text-xl font-bold">${parseFloat(wbrMetrics.monthlyRevenue).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Monthly Profit</p>
              <p className="text-xl font-bold">${parseFloat(wbrMetrics.monthlyGrossProfit).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusColor(wbrMetrics.status)}`}>
              {wbrMetrics.status} — {wbrMetrics.status === "GREEN" ? "PASS" : wbrMetrics.status === "YELLOW" ? "CAUTION" : "WALK"}
            </span>
            {wbrMetrics.status !== "GREEN" && (
              <span className="text-sm ml-3">Min safe bill rate: <strong>${wbrMetrics.minBillRate}/hr</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Response */}
      {loading && (
        <div className="bg-white border rounded-xl p-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Tom is thinking...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>
      )}

      {response && !loading && (
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded font-medium">TOM</span>
            <span className="text-xs text-gray-400">{activeAgent?.replace("-", " ").toUpperCase()}</span>
          </div>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{response}</pre>
        </div>
      )}
    </div>
  );
}
