import { useEffect, useState, type ChangeEvent } from "react";
import { CalendarIcon, PinIcon, PinOffIcon } from "lucide-react";
import { InputGroupInput } from "./ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Toggle } from "./ui/toggle";
import { type DateRange } from "react-day-picker";
import { Button } from "./ui/button";

export type DatePickerRangeProps = {
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

export function DatePickerRange({
  id,
  name,
  placeholder,
  value,
  onChange,
  pinButton,
  onPinChange,
}: DatePickerRangeProps) {
  const [open, setOpen] = useState(false);
  const [internalPin, setInternalPin] = useState<boolean>(false);

  const [fromValue, setFromValue] = useState<string>(
    value?.from ? formatDateValue(value.from) : ""
  );
  const [toValue, setToValue] = useState<string>(
    value?.to ? formatDateValue(value.to) : ""
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

  const displayValue = value?.from
    ? value.to
      ? `${format(value.from, "LLL dd, y")} - ${format(value.to, "LLL dd, y")}`
      : format(value.from, "LLL dd, y")
    : "";

  return (
    <div className="flex gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="justify-start px-2.5 font-normal flex-1"
            disabled={isPined}
          >
            <CalendarIcon />
            {displayValue || <span>{placeholder || "Pick a date range"}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-3 p-3">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Desde</label>
                <InputGroupInput
                  placeholder="dd/mm/aaaa"
                  disabled={isPined}
                  value={fromValue}
                  onChange={handleInputChange("from")}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                  className="w-28"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <InputGroupInput
                  placeholder="dd/mm/aaaa"
                  disabled={isPined}
                  value={toValue}
                  onChange={handleInputChange("to")}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                  className="w-28"
                />
              </div>
            </div>
            <Calendar
              mode="range"
              defaultMonth={month}
              selected={value}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={es}
              min={1}
              formatters={{
                formatMonthDropdown: (date) =>
                  date.toLocaleString("es", { month: "short" }),
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
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
    </div>
  );
}
