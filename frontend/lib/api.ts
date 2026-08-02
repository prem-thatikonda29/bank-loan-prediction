const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export interface PredictionInput {
  Age: number;
  Dependents: number;
  ApplicantIncome: number;
  LoanAmount: number;
  Cibil_Score: number;
  Tenure: number;
  Gender: number;
  Married: number;
  Education: number;
  Self_Employed: number;
  Previous_Loan_Taken: number;
  Property_Area: number;
  Customer_Bandwith: number;
}

export interface RejectionReason {
  feature: string;
  label: string;
  user_value: number;
  typical_approved: number;
  explanation: string;
}

export interface PredictionResponse {
  prediction: number;
  result: "approved" | "rejected";
  message: string;
  rejection_reasons?: RejectionReason[];
}

export interface StatsResponse {
  total: number;
  approved: number;
  rejected: number;
  approval_rate: number;
}

export async function predict(data: PredictionInput): Promise<PredictionResponse> {
  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) return { total: 0, approved: 0, rejected: 0, approval_rate: 0 };
  return res.json();
}
