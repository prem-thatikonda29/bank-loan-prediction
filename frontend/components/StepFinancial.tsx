"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepFinancialProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepFinancial({ data, onChange, errors }: StepFinancialProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Financial Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ApplicantIncome">Income</Label>
          <Input
            id="ApplicantIncome"
            type="number"
            placeholder="e.g. 50000"
            value={data.ApplicantIncome || ""}
            onChange={(e) => onChange("ApplicantIncome", e.target.value)}
            min={0}
          />
          {errors.ApplicantIncome && <p className="text-sm text-red-500">{errors.ApplicantIncome}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="LoanAmount">Loan Amount</Label>
          <Input
            id="LoanAmount"
            type="number"
            placeholder="e.g. 200000"
            value={data.LoanAmount || ""}
            onChange={(e) => onChange("LoanAmount", e.target.value)}
            min={0}
          />
          {errors.LoanAmount && <p className="text-sm text-red-500">{errors.LoanAmount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Cibil_Score">CIBIL Score</Label>
          <Input
            id="Cibil_Score"
            type="number"
            placeholder="300-900"
            value={data.Cibil_Score || ""}
            onChange={(e) => onChange("Cibil_Score", e.target.value)}
            min={300}
            max={900}
          />
          <p className="text-xs text-slate-400">Most important factor</p>
          {errors.Cibil_Score && <p className="text-sm text-red-500">{errors.Cibil_Score}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Tenure">Tenure (months)</Label>
          <Input
            id="Tenure"
            type="number"
            placeholder="e.g. 60"
            value={data.Tenure || ""}
            onChange={(e) => onChange("Tenure", e.target.value)}
            min={1}
            max={360}
          />
          {errors.Tenure && <p className="text-sm text-red-500">{errors.Tenure}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="Self_Employed">Self Employed</Label>
        <Select value={data.Self_Employed || ""} onValueChange={(v) => v && onChange("Self_Employed", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Yes</SelectItem>
            <SelectItem value="0">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
