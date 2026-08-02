"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Select value={data.Previous_Loan_Taken || ""} onValueChange={(v) => v && onChange("Previous_Loan_Taken", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes, previously taken</SelectItem>
              <SelectItem value="0">No, first-time applicant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Property_Area">Property Location</Label>
          <Select value={data.Property_Area || ""} onValueChange={(v) => v && onChange("Property_Area", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Rural area</SelectItem>
              <SelectItem value="1">Semi-urban area</SelectItem>
              <SelectItem value="2">Urban area</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Customer_Bandwith">Banking Relationship</Label>
          <Select value={data.Customer_Bandwith || ""} onValueChange={(v) => v && onChange("Customer_Bandwith", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Good — long-standing customer</SelectItem>
              <SelectItem value="2">Average — some history</SelectItem>
              <SelectItem value="0">Poor — new or limited history</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
