import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
  showAddButton?: boolean;
  onAddClick?: () => void;
  required?: boolean;
  disable?: boolean;
}

export function ComboboxPlus({
  name,
  placeholder = "Selecciona...",
  className,
  options = [],
  value,
  onChange,
  showAddButton = false,
  onAddClick,
  required = false,
  disable = false,
}: ComboboxProps) {
  const [open, setOpen] = useState<boolean>(false);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label ?? placeholder;

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
              disabled={disable}
              className="font-normal justify-between flex-1"
            >
              <span
                className={cn(
                  "truncate",
                  selectedLabel === placeholder && "text-muted-foreground"
                )}
              >
                {selectedLabel}
              </span>
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          {showAddButton && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddClick?.();
              }}
              disabled={disable}
              aria-label="Agregar nuevo"
            >
              <Plus />
            </Button>
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
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0"
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
