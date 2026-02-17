import { Check, ChevronsUpDown, Plus, Pin, PinOff } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useState } from "react";
import { ButtonGroup } from "./ui/button-group";
import { Toggle } from "./ui/toggle";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  name?: string;
  placeholder?: string;
  className?: string;
  options?: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  add?: boolean;
  onAddClick?: () => void;
  required?: boolean;
  disable?: boolean;
  renderLabel?: (option: ComboboxOption) => React.ReactNode;
  fixed?: boolean;
  onFixedChange?: (fixed: boolean) => void;
}

export function ComboboxPlus({
  name,
  placeholder = "",
  className,
  options = [],
  value,
  onChange,
  add = false,
  onAddClick,
  required = false,
  disable = false,
  renderLabel,
  fixed,
  onFixedChange,
}: ComboboxProps) {
  const [open, setOpen] = useState<boolean>(false);
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`${className}`}>
      {name && (
        <input
          id={name}
          type="hidden"
          name={name}
          value={value ?? ""}
          required={required}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <ButtonGroup className="w-full">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disable || isFixed}
              className="font-normal justify-between flex-1"
            >
              <span
                className={cn(
                  "truncate",
                  !selectedOption && "text-muted-foreground",
                )}
              >
                {selectedOption && renderLabel
                  ? renderLabel(selectedOption)
                  : (selectedOption?.label ?? placeholder)}
              </span>
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          {add && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddClick?.();
              }}
              disabled={disable || isFixed}
              aria-label="Agregar nuevo"
            >
              <Plus />
            </Button>
          )}
          {fixed !== undefined && (
            <Toggle
              variant="outline"
              pressed={isFixed}
              onPressedChange={handleFixedChange}
              title={isFixed ? "Soltar" : "Fijar"}
              className="cursor-pointer"
            >
              {isFixed ? <PinOff /> : <Pin />}
            </Toggle>
          )}
        </ButtonGroup>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width)"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Buscar..." className="h-9" />
            <CommandList>
              <CommandEmpty>No se encontró.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange?.(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {renderLabel ? renderLabel(option) : option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
