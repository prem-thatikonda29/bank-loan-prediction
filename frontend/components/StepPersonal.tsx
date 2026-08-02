"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

interface StepPersonalProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepPersonal({ data, onChange, errors }: StepPersonalProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Personal Information</h3>
      <p className="text-sm text-slate-400">Basic details about the primary applicant.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Age">Age (years)</Label>
          <Input
            id="Age"
            type="number"
            placeholder="e.g. 35"
            value={data.Age || ""}
            onChange={(e) => onChange("Age", e.target.value)}
            min={18}
            max={100}
          />
          {errors.Age && <p className="text-sm text-red-500">{errors.Age}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Dependents">Number of Dependents</Label>
          <Input
            id="Dependents"
            type="number"
            placeholder="e.g. 2"
            value={data.Dependents || ""}
            onChange={(e) => onChange("Dependents", e.target.value)}
            min={0}
            max={20}
          />
          <p className="text-xs text-slate-400">Family members financially dependent on you</p>
          {errors.Dependents && <p className="text-sm text-red-500">{errors.Dependents}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Gender">Gender</Label>
          <NativeSelect
            id="Gender"
            placeholder="Select"
            value={data.Gender || ""}
            onChange={(e) => onChange("Gender", e.target.value)}
            options={[
              { value: "1", label: "Male" },
              { value: "0", label: "Female" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Married">Marital Status</Label>
          <NativeSelect
            id="Married"
            placeholder="Select"
            value={data.Married || ""}
            onChange={(e) => onChange("Married", e.target.value)}
            options={[
              { value: "1", label: "Married" },
              { value: "0", label: "Single" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Education">Education Level</Label>
          <NativeSelect
            id="Education"
            placeholder="Select"
            value={data.Education || ""}
            onChange={(e) => onChange("Education", e.target.value)}
            options={[
              { value: "1", label: "Graduate" },
              { value: "0", label: "Not Graduate" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
