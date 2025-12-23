import { useState, type ChangeEvent } from "react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";

type DatePickerProps = {
  name?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
};

export function DatePicker({
  name,
  placeholder = "dd/mm/aaaa",
  className,
  value,
  onChange,
  required = false,
}: DatePickerProps) {
  const [openCalendar, setOpenCalendar] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(
    value && isValid(parse(value, "dd/MM/yyyy", new Date()))
      ? parse(value, "dd/MM/yyyy", new Date())
      : undefined
  );

  const currentYear = new Date().getFullYear();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/[^\d]/g, "");

    if (value.length === 0) {
      if (onChange) onChange("");
      return;
    }

    if (value.length > 8) value = value.slice(0, 8);

    let day = value.slice(0, 2);
    let month = value.slice(2, 4);
    let year = value.slice(4, 8);

    if (day.length === 2) {
      let d = parseInt(day);
      if (d > 31) d = 31;
      if (d === 0) d = 1;
      day = d.toString().padStart(2, "0");
    }

    if (month.length === 2) {
      let m = parseInt(month);
      if (m > 12) m = 12;
      if (m === 0) m = 1;
      month = m.toString().padStart(2, "0");
    }

    if (year.length === 4) {
      let y = parseInt(year);
      if (y > currentYear) y = currentYear;
      if (y < 1) y = 1;
      year = y.toString();
    }

    let formatted = day;
    if (month) formatted += "/" + month;
    if (year) formatted += "/" + year;

    if (onChange) onChange(formatted);

    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        setMonth(parsed);
      } else {
        setMonth(undefined);
      }
    }
  };

  const formatDate = (date: Date | undefined) =>
    date ? format(date, "dd/MM/yyyy") : "";

  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleInputChange}
        onBlur={() => {
          if (
            value?.length === 10 &&
            !isValid(parse(value, "dd/MM/yyyy", new Date()))
          ) {
            if (onChange) onChange("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpenCalendar(true);
          }
        }}
      />
      <Popover>
        <PopoverTrigger asChild>
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="ghost">
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
            selected={
              value && isValid(parse(value, "dd/MM/yyyy", new Date()))
                ? parse(value, "dd/MM/yyyy", new Date())
                : undefined
            }
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              if (onChange) onChange(formatDate(date));
              setMonth(date);
              setOpenCalendar(false);
            }}
            locale={es}
            formatters={{
              formatMonthDropdown: (date) =>
                date.toLocaleString("es", { month: "short" }),
            }}
          />
        </PopoverContent>
      </Popover>
    </InputGroup>
  );
}
