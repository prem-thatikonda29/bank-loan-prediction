import { cn } from "@/lib/utils";

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function NativeSelect({ options, placeholder, className, ...props }: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-input bg-white px-3 py-2 pr-8 text-sm text-foreground transition-colors",
          "outline-none focus:border-ring focus:ring-2 focus:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:focus:border-ring dark:focus:ring-ring/20",
          !props.value && "text-muted-foreground",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
