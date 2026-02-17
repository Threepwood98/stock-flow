import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState } from "react";
import { ButtonGroup } from "./ui/button-group";
import { Toggle } from "./ui/toggle";
import { Pin, PinOff } from "lucide-react";

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
  fixed?: boolean;
  onFixedChange?: (fixed: boolean) => void;
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
  fixed,
  onFixedChange,
}: SelectListProps) {
  const [internalFixed, setInternalFixed] = useState<boolean>(false);

  const isControlled = fixed !== undefined;
  const isFixed = isControlled ? fixed : internalFixed;

  const handleFixedChange = (newFixed: boolean) => {
    if (isControlled) {
      onFixedChange?.(newFixed);
    } else {
      setInternalFixed(newFixed);
    }
  };

  return (
    <ButtonGroup className="w-full">
      <Select
        name={name}
        value={value}
        onValueChange={onChange}
        required={required}
        disabled={disabled || isFixed}
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
      {fixed !== undefined && (
        <Toggle
          pressed={isFixed}
          onPressedChange={handleFixedChange}
          title={isFixed ? "Soltar" : "Fijar"}
          className="hover:bg-transparent cursor-pointer data-[state=on]:bg-transparent"
        >
          {isFixed ? <PinOff /> : <Pin />}
        </Toggle>
      )}
    </ButtonGroup>
  );
}
