"use client";

import { motion } from "motion/react";

export function Hero() {
  const scrollToCalculator = () => {
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-[80dvh] flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-transparent">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-800"
        >
          Smart Loan
          <br />
          Decisions
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-lg text-slate-500 max-w-md mx-auto"
        >
          Our machine learning model analyzes 13 financial factors to predict
          loan approval.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={scrollToCalculator}
          className="mt-8 inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Try the Predictor
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 flex-wrap"
        >
          {["Python", "Flask", "scikit-learn", "Next.js"].map((tech, i) => (
            <span key={tech} className="flex items-center gap-2">
              {i > 0 && <span>·</span>}
              <span className="px-2 py-1 bg-slate-100 rounded text-slate-500">{tech}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
