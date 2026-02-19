"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Card {
  id: string;
  name: string;
  contact: { id: string; name: string; email: string; phone: string };
  monetaryValue: number;
  daysInStage: number | null;
}

interface Stage {
  id: string;
  name: string;
  cards: Card[];
  totalValue: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export default function BoardPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBoard()
      .then((res) => setPipelines(res.pipelines || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading board...</p></div>;
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Board</h1>

      {pipelines.map((pipeline) => (
        <div key={pipeline.id} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{pipeline.name}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipeline.stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="bg-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">{stage.name}</h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      {stage.cards.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    ${stage.totalValue.toLocaleString()}
                  </p>
                  <div className="space-y-2">
                    {stage.cards.map((card) => (
                      <Link
                        key={card.id}
                        href={`/contacts/${card.contact.id}`}
                        className="block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.contact.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-green-700">
                            ${card.monetaryValue.toLocaleString()}
                          </span>
                          {card.daysInStage !== null && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              card.daysInStage > 14 ? "bg-red-100 text-red-700" :
                              card.daysInStage > 7 ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {card.daysInStage}d
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {pipelines.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No pipeline data yet. Sync with GHL first.</p>
        </div>
      )}
    </div>
  );
}
