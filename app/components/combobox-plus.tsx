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
import { useState, type ReactNode } from "react";
import { ButtonGroup } from "./ui/button-group";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

export interface ComboboxOption {
  value: string;
  label: string;
  costPrice?: { d: Number };
  salePrice?: { d: Number };
}

interface DialogContentProps {
  onClose: (shouldClose: boolean) => void;
  onSuccess: (newOption: ComboboxOption) => void;
}

type DialogContentType = ReactNode | ((props: DialogContentProps) => ReactNode);

interface ComboboxProps {
  name?: string;
  placeholder?: string;
  className?: string;
  options?: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  showAddButton?: boolean;
  dialogContent?: DialogContentType;
  onDialogSuccess?: (newOption: ComboboxOption) => void;
  required?: boolean;
}

export function ComboboxPlus({
  name,
  placeholder = "Selecciona...",
  className,
  options = [],
  value,
  onChange,
  showAddButton = false,
  dialogContent,
  onDialogSuccess,
  required = false,
}: ComboboxProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const label = value
    ? options.find((opt) => opt.value === value)?.label
    : placeholder;

  const handleDialogClose = (shouldClose: boolean) => {
    setDialogOpen(!shouldClose);
  };

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
          {showAddButton && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Plus />
                </Button>
              </DialogTrigger>
              <DialogContent>
                {dialogContent && typeof dialogContent === "function"
                  ? dialogContent({
                      onClose: handleDialogClose,
                      onSuccess: (newOption: ComboboxOption) => {
                        onDialogSuccess?.(newOption);
                        setDialogOpen(false);
                      },
                    })
                  : dialogContent}
              </DialogContent>
            </Dialog>
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
