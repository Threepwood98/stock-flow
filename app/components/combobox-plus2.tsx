import { PinIcon, PinOffIcon, PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { Toggle } from "./ui/toggle";
import { useState } from "react";
import type { ReactNode } from "react";

type Item = {
  label: string;
  value: string;
};

interface ComboboxProps {
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  items?: Item[];
  value?: Item;
  onValueChange?: (value: Item) => void;
  addButton?: boolean;
  onAddClick?: () => void;
  pin?: boolean;
  onPinChange?: (pin: boolean) => void;
  renderItem?: (item: Item) => ReactNode;
}

export function ComboboxPlus2({
  id,
  name,
  required,
  placeholder,
  items,
  value,
  onValueChange,
  addButton,
  onAddClick,
  pin,
  onPinChange,
  renderItem,
}: ComboboxProps) {
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

  const handleValueChange = (newValue: Item | null) => {
    if (newValue) {
      onValueChange?.(newValue);
    }
  };

  return (
    <Combobox
      id={id}
      name={name}
      required={required}
      disabled={isPined}
      items={items}
      itemToStringValue={(item: Item) => item.value}
      value={value}
      onValueChange={handleValueChange}
      defaultValue={items?.[0]}
    >
      <ButtonGroup className="w-full">
        <ComboboxInput
          placeholder={placeholder}
          disabled={isPined}
          className="flex flex-1"
        />
        <ComboboxContent>
          <ComboboxEmpty>No se encontró.</ComboboxEmpty>
          <ComboboxList>
            {(item: Item) => (
              <ComboboxItem key={item.value} value={item}>
                {renderItem ? renderItem(item) : item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
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
    </Combobox>
  );
}
