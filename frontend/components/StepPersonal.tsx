"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Select value={data.Gender || ""} onValueChange={(v) => v && onChange("Gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Male</SelectItem>
              <SelectItem value="0">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Married">Marital Status</Label>
          <Select value={data.Married || ""} onValueChange={(v) => v && onChange("Married", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Married</SelectItem>
              <SelectItem value="0">Single</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Education">Education Level</Label>
          <Select value={data.Education || ""} onValueChange={(v) => v && onChange("Education", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Graduate</SelectItem>
              <SelectItem value="0">Not Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
