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

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  name?: string;
  placeholder?: string;
  className?: string;
  classNameOptions?: string;
  options?: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function Combobox({
  name,
  placeholder = "Selecciona...",
  className,
  options = [],
  value,
  onChange,
  required = false,
}: ComboboxProps) {
  const [open, setOpen] = useState<boolean>(false);

  const label = value
    ? options.find((opt) => opt.value === value)?.label
    : placeholder;

  return (
    <div className={`${className}`}>
      <input
        id={name}
        type="hidden"
        name={name}
        value={value}
        required={required}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <ButtonGroup className="w-full">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="font-normal justify-between flex-1"
            >
              <div
                className={`${
                  label === placeholder ? "text-muted-foreground" : ""
                }`}
              >
                {label}
              </div>
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          <Button type="button" variant="outline">
            <Plus />
          </Button>
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
                      if (onChange)
                        onChange(currentValue === value ? "" : currentValue);
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
