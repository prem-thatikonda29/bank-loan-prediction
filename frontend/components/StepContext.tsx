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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Previous_Loan_Taken">Previous Loan</Label>
          <Select value={data.Previous_Loan_Taken || ""} onValueChange={(v) => v && onChange("Previous_Loan_Taken", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Property_Area">Property Area</Label>
          <Select value={data.Property_Area || ""} onValueChange={(v) => v && onChange("Property_Area", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Rural</SelectItem>
              <SelectItem value="1">Semiurban</SelectItem>
              <SelectItem value="2">Urban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Customer_Bandwith">Banking History</Label>
          <Select value={data.Customer_Bandwith || ""} onValueChange={(v) => v && onChange("Customer_Bandwith", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Bad</SelectItem>
              <SelectItem value="1">Good</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
