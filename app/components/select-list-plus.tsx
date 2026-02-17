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
import { Pin, PinIcon, PinOff, PinOffIcon, PlusIcon } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  items?: string[];
  value?: string;
  onValueChange?: (value: string) => void;
  addButton?: boolean;
  onAddClick?: () => void;
  pin?: boolean;
  onPinChange?: (pin: boolean) => void;
  className?: string;
}

export function SelectListPlus({
  name,
  placeholder,
  required,
  disabled,
  className,
  items = [],
  value,
  onValueChange,
  addButton,
  onAddClick,
  pin,
  onPinChange,
}: Props) {
  const [internalPin, setInternalPin] = useState<boolean>(false);

  const isControlled = onPinChange !== undefined;
  const isPined = isControlled ? pin : internalPin;

  const handlePinChange = (newPin: boolean) => {
    if (isControlled) {
      onPinChange?.(newPin);
    } else {
      setInternalPin(newPin);
    }
  };

  return (
    <ButtonGroup className="w-full">
      <Select
        name={name}
        required={required}
        disabled={disabled || isPined}
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className={className}>
          <SelectValue id={name} placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item, index) => (
              <SelectItem key={index} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {addButton && (
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onAddClick?.();
          }}
        >
          <PlusIcon />
        </Button>
      )}
      {pin !== undefined && (
        <Toggle
          variant="outline"
          pressed={isPined}
          onPressedChange={handlePinChange}
          title={isPined ? "Soltar" : "Fijar"}
          className="cursor-pointer"
        >
          {isPined ? <PinOffIcon /> : <PinIcon />}
        </Toggle>
      )}
    </ButtonGroup>
  );
}
