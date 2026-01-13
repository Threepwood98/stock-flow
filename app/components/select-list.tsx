import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface SelectListOption {
  value: string;
  label: string;
}

interface SelectListProps {
  name?: string;
  placeholder?: string;
  className?: string;
  options?: SelectListOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SelectList({
  name,
  placeholder = "Selecciona...",
  className,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
}: SelectListProps) {
  return (
<Select
      name={name}
      value={value}
      onValueChange={onChange}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue id={name} placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
