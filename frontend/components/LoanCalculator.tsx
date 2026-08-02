"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { StepPersonal } from "./StepPersonal";
import { StepFinancial } from "./StepFinancial";
import { StepContext } from "./StepContext";
import { PredictionResult } from "./PredictionResult";
import { predict, type PredictionResponse } from "@/lib/api";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Financial" },
  { id: 3, label: "Context" },
];

const REQUIRED_FIELDS: Record<number, string[]> = {
  1: ["Age", "Dependents"],
  2: ["ApplicantIncome", "LoanAmount", "Cibil_Score", "Tenure"],
  3: ["Gender", "Married", "Education", "Self_Employed", "Previous_Loan_Taken", "Property_Area", "Customer_Bandwith"],
};

export function LoanCalculator() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const fields = REQUIRED_FIELDS[step];
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (!data[field]) {
        newErrors[field] = "This field is required";
      }
    }

    if (step === 2 && data.Cibil_Score) {
      const score = parseInt(data.Cibil_Score);
      if (score < 300 || score > 900) {
        newErrors.Cibil_Score = "CIBIL score must be between 300 and 900";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const input = {
        Age: parseInt(data.Age || "0"),
        Dependents: parseInt(data.Dependents || "0"),
        ApplicantIncome: parseInt(data.ApplicantIncome || "0"),
        LoanAmount: parseInt(data.LoanAmount || "0"),
        Cibil_Score: parseInt(data.Cibil_Score || "0"),
        Tenure: parseInt(data.Tenure || "0"),
        Gender: parseInt(data.Gender || "0"),
        Married: parseInt(data.Married || "0"),
        Education: parseInt(data.Education || "0"),
        Self_Employed: parseInt(data.Self_Employed || "0"),
        Previous_Loan_Taken: parseInt(data.Previous_Loan_Taken || "0"),
        Property_Area: parseInt(data.Property_Area || "0"),
        Customer_Bandwith: parseInt(data.Customer_Bandwith || "0"),
      };
      const res = await predict(input);
      setResult(res);
    } catch {
      setErrors({ submit: "Failed to get prediction. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setStep(1);
    setData({});
    setErrors({});
  };

  return (
    <div id="calculator" className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > s.id
                      ? "bg-blue-500 text-white"
                      : step === s.id
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step >= s.id ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    step > s.id ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6">
          {result ? (
            <PredictionResult result={result} onTryAgain={handleTryAgain} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && <StepPersonal data={data} onChange={handleChange} errors={errors} />}
                {step === 2 && <StepFinancial data={data} onChange={handleChange} errors={errors} />}
                {step === 3 && <StepContext data={data} onChange={handleChange} errors={errors} />}
              </motion.div>
            </AnimatePresence>
          )}

          {errors.submit && (
            <p className="mt-4 text-sm text-red-500 text-center">{errors.submit}</p>
          )}
        </div>

        {/* Navigation */}
        {!result && (
          <div className="flex justify-between px-6 py-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Predicting...
                  </>
                ) : (
                  "Get Prediction"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
