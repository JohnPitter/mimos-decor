import { useCallback } from "react";

type MaskType = "integer" | "currency" | "percentage" | "text" | "cpfcnpj";

interface Props {
  mask: MaskType;
  value: string | number | null;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: string;
}

const INPUT_CLASS = "w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function rawCpfCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function MaskedInput({ mask, value, onChange, placeholder, required, className, min }: Props) {
  const cls = className ?? INPUT_CLASS;
  const strValue = value === null || value === undefined ? "" : String(value);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    switch (mask) {
      case "integer": {
        const clean = raw.replace(/\D/g, "");
        onChange(clean);
        break;
      }
      case "currency":
      case "percentage": {
        // Allow digits, one dot or comma as decimal separator
        const clean = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
        // Only allow one decimal point
        const parts = clean.split(".");
        const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : clean;
        onChange(sanitized);
        break;
      }
      case "cpfcnpj": {
        const digits = raw.replace(/\D/g, "").slice(0, 14);
        onChange(digits);
        break;
      }
      default:
        onChange(raw);
    }
  }, [mask, onChange]);

  const displayValue = mask === "cpfcnpj" && strValue ? formatCpfCnpj(strValue) : strValue;

  const inputMode = mask === "integer" || mask === "currency" || mask === "percentage"
    ? "decimal" as const
    : mask === "cpfcnpj"
      ? "numeric" as const
      : undefined;

  return (
    <input
      type="text"
      inputMode={mask === "integer" ? "numeric" : inputMode}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      min={min}
      className={cls}
    />
  );
}

export function unmaskCpfCnpj(value: string): string {
  return rawCpfCnpj(value);
}
