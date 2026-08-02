"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { PredictionResponse } from "@/lib/api";

interface PredictionResultProps {
  result: PredictionResponse;
  onTryAgain: () => void;
}

export function PredictionResult({ result, onTryAgain }: PredictionResultProps) {
  const isApproved = result.result === "approved";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl p-6 border ${
        isApproved
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        {isApproved ? (
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" clipRule="evenodd" />
          </svg>
        )}
        <h3 className={`text-xl font-semibold ${isApproved ? "text-green-600" : "text-red-600"}`}>
          Loan {isApproved ? "Approved" : "Rejected"}
        </h3>
      </div>

      <p className="text-slate-600 mb-4">
        {isApproved
          ? "Based on your inputs, our model predicts your loan would be approved."
          : "Based on your inputs, our model predicts your loan would not be approved at this time."}
      </p>

      {!isApproved && result.rejection_reasons && result.rejection_reasons.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Here&apos;s what may have affected the decision:</p>
          <div className="space-y-2">
            {result.rejection_reasons.map((reason, i) => (
              <div key={i} className="bg-white/60 rounded-lg p-3 border border-red-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">{reason.label}</span>
                </div>
                <p className="text-sm text-slate-500">{reason.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" onClick={onTryAgain}>
        Try Again
      </Button>
    </motion.div>
  );
}
