import { useEffect, useState, type ChangeEvent } from "react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, PinIcon, PinOffIcon, MinusIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { ButtonGroup } from "./ui/button-group";
import { Toggle } from "./ui/toggle";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./ui/input-group";

export type DatePickerRange2Props = {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: DateRange;
  onChange?: (value: DateRange) => void;
  pinButton?: boolean;
  onPinChange?: (pinned: boolean) => void;
};

const currentYear = new Date().getFullYear();

function validateDay(day: string, month?: string, year?: string): string {
  if (day.length !== 2) return day;

  let d = parseInt(day);
  if (d === 0) return "01";

  let maxDays = 31;
  if (month?.length === 2) {
    const m = parseInt(month);
    if (m === 2) {
      maxDays = year?.length === 4 && parseInt(year) % 4 === 0 ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(m)) {
      maxDays = 30;
    }
  }

  if (d > maxDays) d = maxDays;
  return d.toString().padStart(2, "0");
}

function validateMonth(month: string): string {
  if (month.length !== 2) return month;

  let m = parseInt(month);
  if (m === 0) return "01";
  if (m > 12) m = 12;
  return m.toString().padStart(2, "0");
}

function validateYear(year: string): string {
  if (year.length !== 4) return year;

  let y = parseInt(year);
  if (y > currentYear) y = currentYear;
  if (y < 1900) y = 1900;
  return y.toString();
}

function formatDateValue(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
}

function parseDateValue(value: string): Date | undefined {
  if (!value || value.length !== 10) return undefined;
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePickerRange2({
  id,
  name,
  placeholder,
  value,
  onChange,
  pinButton,
  onPinChange,
}: DatePickerRange2Props) {
  const [open, setOpen] = useState(false);
  const [internalPin, setInternalPin] = useState<boolean>(false);

  const [fromValue, setFromValue] = useState<string>(
    value?.from ? formatDateValue(value.from) : "",
  );
  const [toValue, setToValue] = useState<string>(
    value?.to ? formatDateValue(value.to) : "",
  );

  const [month, setMonth] = useState<Date | undefined>(value?.from);

  const isControlled = onPinChange !== undefined;
  const isPined = isControlled ? pinButton : internalPin;

  useEffect(() => {
    if (value?.from) {
      setFromValue(formatDateValue(value.from));
    }
    if (value?.to) {
      setToValue(formatDateValue(value.to));
    }
  }, [value]);

  const handleInputChange =
    (field: "from" | "to") => (event: ChangeEvent<HTMLInputElement>) => {
      let inputValue = event.target.value.replace(/[^\d/]/g, "");
      inputValue = inputValue.replace(/\/+/g, "/");

      let digitsOnly = inputValue.replace(/[^\d]/g, "");

      if (digitsOnly.length === 0) {
        if (field === "from") {
          setFromValue("");
          onChange?.({ from: undefined, to: value?.to });
        } else {
          setToValue("");
          onChange?.({ from: value?.from, to: undefined });
        }
        return;
      }

      if (digitsOnly.length > 8) digitsOnly = digitsOnly.slice(0, 8);

      let day = digitsOnly.slice(0, 2);
      let month = digitsOnly.slice(2, 4);
      let year = digitsOnly.slice(4, 8);

      day = validateDay(day, month, year);
      month = validateMonth(month);
      year = validateYear(year);

      let formatted = day;
      if (month) formatted += "/" + month;
      if (year) formatted += "/" + year;

      if (field === "from") {
        setFromValue(formatted);
        if (formatted.length === 10) {
          const parsed = parseDateValue(formatted);
          if (parsed) {
            onChange?.({ from: parsed, to: value?.to });
            setMonth(parsed);
          }
        } else {
          onChange?.({ from: undefined, to: value?.to });
        }
      } else {
        setToValue(formatted);
        if (formatted.length === 10) {
          const parsed = parseDateValue(formatted);
          if (parsed) {
            onChange?.({ from: value?.from, to: parsed });
          }
        } else {
          onChange?.({ from: value?.from, to: undefined });
        }
      }
    };

  const handlePinChange = (newPined: boolean) => {
    if (isControlled) {
      onPinChange?.(newPined);
    } else {
      setInternalPin(newPined);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setFromValue(formatDateValue(range.from));
      setToValue(formatDateValue(range.to));
      onChange?.(range);
    } else if (range?.from) {
      setFromValue(formatDateValue(range.from));
      setToValue("");
      onChange?.({ from: range.from, to: undefined });
    }
    if (range?.from) {
      setMonth(range.from);
    }
  };

  return (
    <ButtonGroup className="w-full">
      <InputGroup>
        <InputGroupInput
          id={`${id}-from`}
          name={name ? `${name}From` : undefined}
          placeholder={placeholder}
          disabled={isPined}
          value={fromValue}
          onChange={handleInputChange("from")}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupText>
          <MinusIcon />
        </InputGroupText>
        <InputGroupInput
          id={`${id}-to`}
          name={name ? `${name}To` : undefined}
          placeholder={placeholder}
          disabled={isPined}
          value={toValue}
          onChange={handleInputChange("to")}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <div className="flex flex-[0.6]" />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id={id}
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
                mode="range"
                selected={value}
                defaultMonth={month}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                locale={es}
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
