import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { CalendarIcon, PinIcon, PinOffIcon } from "lucide-react";
import { Field, FieldLabel } from "./ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { ButtonGroup } from "./ui/button-group";
import { Toggle } from "./ui/toggle";

type DatePickerProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  pinButton?: boolean;
  onPinChange?: (pined: boolean) => void;
};

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function DatePickerPlus2({
  id,
  name,
  placeholder,
  required,
  value,
  onChange,
  pinButton,
  onPinChange,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalPin, setInternalPin] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();

  const validateDay = (day: string, month?: string, year?: string): string => {
    if (day.length !== 2) return day;

    let d = parseInt(day);
    if (d === 0) return "01";

    // Get max days for the specific month
    let maxDays = 31;
    if (month?.length === 2) {
      const m = parseInt(month);
      if (m === 2) {
        // February
        maxDays = year?.length === 4 && parseInt(year) % 4 === 0 ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(m)) {
        // Apr, Jun, Sep, Nov
        maxDays = 30;
      }
    }

    if (d > maxDays) d = maxDays;
    return d.toString().padStart(2, "0");
  };

  const validateMonth = (month: string): string => {
    if (month.length !== 2) return month;

    let m = parseInt(month);
    if (m === 0) return "01";
    if (m > 12) m = 12;
    return m.toString().padStart(2, "0");
  };

  const validateYear = (year: string): string => {
    if (year.length !== 4) return year;

    let y = parseInt(year);
    if (y > currentYear) y = currentYear;
    if (y < 1900) y = 1900; // Reasonable minimum year
    return y.toString();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/[^\d/]/g, "");

    // Remove extra slashes
    value = value.replace(/\/+/g, "/");

    // Remove all non-digits for processing
    let digitsOnly = value.replace(/[^\d]/g, "");

    if (digitsOnly.length === 0) {
      if (onChange) onChange("");
      setMonth(undefined);
      return;
    }

    if (digitsOnly.length > 8) digitsOnly = digitsOnly.slice(0, 8);

    let day = digitsOnly.slice(0, 2);
    let month = digitsOnly.slice(2, 4);
    let year = digitsOnly.slice(4, 8);

    // Validate each component
    day = validateDay(day, month, year);
    month = validateMonth(month);
    year = validateYear(year);

    // Build formatted string
    let formatted = day;
    if (month) formatted += "/" + month;
    if (year) formatted += "/" + year;

    if (onChange) onChange(formatted);

    // Update calendar month state when we have a valid date
    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        setMonth(parsed);
      }
    }
  };

  const isControlled = onPinChange !== undefined;
  const isPined = isControlled ? pinButton : internalPin;

  const parsedDate = useMemo(() => {
    if (!value || value.length !== 10) return undefined;
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const [month, setMonth] = useState<Date | undefined>(parsedDate);

  const formatDate = (date: Date | undefined): string =>
    date ? format(date, "dd/MM/yyyy") : "";

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      const formatedDate = formatDate(date);
      if (onChange) onChange(formatedDate);
      setMonth(date);
    } else {
      if (onChange) onChange("");
      setMonth(undefined);
    }
    setOpen(false);
  };

  const handlePinChange = (newPined: boolean) => {
    if (isControlled) {
      onPinChange?.(newPined);
    } else {
      setInternalPin(newPined);
    }
  };

  return (
    <ButtonGroup className="w-full">
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          placeholder={placeholder}
          disabled={isPined}
          required={required}
          value={value}
          onChange={handleInputChange}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
                disabled={isPined}
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={parsedDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleCalendarSelect}
                locale={es}
                defaultMonth={parsedDate || new Date()}
                formatters={{
                  formatMonthDropdown: (date) =>
                    date.toLocaleString("es", { month: "short" }),
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {pinButton !== undefined && (
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
