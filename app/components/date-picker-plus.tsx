import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "~/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon, Pin, PinOff } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Toggle } from "./ui/toggle";

type DatePickerProps = {
  name?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  fixed?: boolean;
  onFixedChange?: (fixed: boolean) => void;
};

export function DatePickerPlus({
  name,
  placeholder = "dd/mm/aaaa",
  className,
  value,
  onChange,
  required = false,
  disabled = false,
  errorMessage,
  fixed,
  onFixedChange,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalFixed, setInternalFixed] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();

  const isControlled = fixed !== undefined;
  const isFixed = isControlled ? fixed : internalFixed;

  const handleFixedChange = (newFixed: boolean) => {
    if (isControlled) {
      onFixedChange?.(newFixed);
    } else {
      setInternalFixed(newFixed);
    }
  };

  // Memoized date parsing to avoid repeated parsing
  const parsedDate = useMemo(() => {
    if (!value || value.length !== 10) return undefined;
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  // Sync month state with parsed value
  useEffect(() => {
    if (parsedDate) {
      setMonth(parsedDate);
    }
  }, [parsedDate]);

  const [month, setMonth] = useState<Date | undefined>(parsedDate);

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

  const handleBlur = () => {
    if (
      value &&
      value.length === 10 &&
      !isValid(parse(value, "dd/MM/yyyy", new Date()))
    ) {
      if (onChange) onChange("");
      setMonth(undefined);
    }
  };

  const hasError =
    errorMessage || (value && value.length === 10 && !parsedDate);
  const errorId = hasError ? `${name}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <InputGroup
        className={cn(
          hasError && "border-destructive focus-within:ring-destructive",
        )}
      >
        <InputGroupInput
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled || isFixed}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            }
          }}
          aria-label={placeholder}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={cn(name && `${name}-description`, errorId)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                disabled={disabled || isFixed}
                aria-label="Abrir calendario"
                aria-expanded={open}
                aria-haspopup="dialog"
                type="button"
              >
                <CalendarIcon />
              </InputGroupButton>
            </InputGroupAddon>
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
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
              locale={es}
              defaultMonth={parsedDate || new Date()}
              formatters={{
                formatMonthDropdown: (date) =>
                  date.toLocaleString("es", { month: "short" }),
              }}
              // fromDate={new Date(1900, 0, 1)}
              // toDate={new Date(currentYear, 11, 31)}
            />
          </PopoverContent>
        </Popover>
        {fixed !== undefined && (
          <InputGroupAddon align="inline-end">
            <Toggle
              pressed={isFixed}
              onPressedChange={handleFixedChange}
              title={isFixed ? "Soltar" : "Fijar"}
              className="hover:bg-transparent cursor-pointer data-[state=on]:bg-transparent"
            >
              {isFixed ? <PinOff /> : <Pin />}
            </Toggle>
          </InputGroupAddon>
        )}
      </InputGroup>
      {hasError && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {errorMessage || "Fecha inválida. Use formato dd/mm/aaaa"}
        </p>
      )}
    </div>
  );
}
