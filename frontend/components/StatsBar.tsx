"use client";

import { useEffect, useState } from "react";
import { getStats, type StatsResponse } from "@/lib/api";

export function StatsBar() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return (
    <div className="border-t border-b border-slate-200 bg-white">
      <div className="max-w-2xl mx-auto px-4 py-4 text-center">
        {stats === null ? (
          <div className="h-4 bg-slate-100 rounded animate-pulse max-w-xs mx-auto" />
        ) : stats.available && stats.total > 0 ? (
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-600">{stats.total.toLocaleString()}</span> predictions made ·{" "}
            <span className="font-medium text-slate-600">{stats.approval_rate}%</span> approved
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Built with <span className="font-medium text-slate-500">scikit-learn</span> · Try the predictor below
          </p>
        )}
      </div>
    </div>
  );
}
