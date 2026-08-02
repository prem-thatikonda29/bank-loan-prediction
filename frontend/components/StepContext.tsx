"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

interface StepContextProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepContext({ data, onChange, errors }: StepContextProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Loan Context</h3>
      <p className="text-sm text-slate-400">Additional factors that influence the decision.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Previous_Loan_Taken">Previous Loan History</Label>
          <NativeSelect
            id="Previous_Loan_Taken"
            placeholder="Select"
            value={data.Previous_Loan_Taken || ""}
            onChange={(e) => onChange("Previous_Loan_Taken", e.target.value)}
            options={[
              { value: "1", label: "Yes, previously taken" },
              { value: "0", label: "No, first-time applicant" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Property_Area">Property Location</Label>
          <NativeSelect
            id="Property_Area"
            placeholder="Select"
            value={data.Property_Area || ""}
            onChange={(e) => onChange("Property_Area", e.target.value)}
            options={[
              { value: "0", label: "Rural area" },
              { value: "1", label: "Semi-urban area" },
              { value: "2", label: "Urban area" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Customer_Bandwith">Banking Relationship</Label>
          <NativeSelect
            id="Customer_Bandwith"
            placeholder="Select"
            value={data.Customer_Bandwith || ""}
            onChange={(e) => onChange("Customer_Bandwith", e.target.value)}
            options={[
              { value: "1", label: "Good — long-standing customer" },
              { value: "2", label: "Average — some history" },
              { value: "0", label: "Poor — new or limited history" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
