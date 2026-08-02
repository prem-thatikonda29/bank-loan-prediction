"use client";

import { motion } from "motion/react";

const FEATURES = [
  { name: "CIBIL Score", importance: 29, explanation: "Your credit history is the single biggest factor. A score above 750 significantly improves your chances." },
  { name: "Banking History", importance: 20, explanation: "How well you've managed your banking relationships matters more than you'd think." },
  { name: "Loan Amount", importance: 15, explanation: "Smaller loans relative to your income are easier to get approved." },
  { name: "Income", importance: 12, explanation: "Higher income demonstrates you have the capacity to repay." },
  { name: "Education", importance: 8, explanation: "Higher education often correlates with employment stability." },
  { name: "Other factors", importance: 16, explanation: "Gender, marital status, property area, and tenure each contribute less than 5%." },
];

export function FeatureImportance() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">How The Model Decides</h2>
      <p className="text-slate-500 mb-8">Not all factors carry equal weight. Here&apos;s what matters most.</p>

      <div className="space-y-6">
        {FEATURES.map((feature, i) => (
          <div key={feature.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{feature.name}</span>
              <span className="text-sm font-mono text-slate-500">{feature.importance}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${feature.importance}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{feature.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
