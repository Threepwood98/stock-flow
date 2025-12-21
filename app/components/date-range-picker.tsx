import { ArrowRightIcon } from "lucide-react";
import { DatePicker } from "./date-picker";
import { useState, useEffect } from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
  parse,
  isValid,
  isAfter,
} from "date-fns";

interface DateRangePickerProps {
  // Valores controlados desde el padre
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onRangeChange?: (range: { dateFrom: string; dateTo: string }) => void;

  // Configuración
  required?: boolean;
  disabled?: boolean;
  className?: string;

  // Valores por defecto
  defaultDateFrom?: string;
  defaultDateTo?: string;

  // Validación
  validateRange?: boolean; // validar que dateFrom <= dateTo

  // Placeholders
  placeholderFrom?: string;
  placeholderTo?: string;
}

export function DateRangePicker({
  // Props controladas
  dateFrom: controlledDateFrom,
  dateTo: controlledDateTo,
  onDateFromChange,
  onDateToChange,
  onRangeChange,

  // Configuración
  required = false,
  disabled = false,
  className = "",

  // Valores por defecto
  defaultDateFrom,
  defaultDateTo,

  // Validación
  validateRange = true,

  // Placeholders
  placeholderFrom = "dd/mm/aaaa",
  placeholderTo = "dd/mm/aaaa",
}: DateRangePickerProps) {
  // Determinar valores iniciales (formato dd/MM/yyyy para DatePicker)
  const getInitialDateFrom = () => {
    if (controlledDateFrom) return controlledDateFrom;
    if (defaultDateFrom) return defaultDateFrom;
    return format(startOfMonth(new Date()), "dd/MM/yyyy");
  };

  const getInitialDateTo = () => {
    if (controlledDateTo) return controlledDateTo;
    if (defaultDateTo) return defaultDateTo;
    return format(endOfMonth(new Date()), "dd/MM/yyyy");
  };

  // Estado interno (solo si no está controlado)
  const [internalDateFrom, setInternalDateFrom] = useState(
    getInitialDateFrom()
  );
  const [internalDateTo, setInternalDateTo] = useState(getInitialDateTo());
  const [error, setError] = useState<string>("");

  // Usar valores controlados si están disponibles
  const dateFrom = controlledDateFrom ?? internalDateFrom;
  const dateTo = controlledDateTo ?? internalDateTo;

  // Validar rango de fechas
  useEffect(() => {
    if (validateRange && dateFrom && dateTo) {
      // Solo validar si ambas fechas están completas (formato dd/MM/yyyy)
      if (dateFrom.length === 10 && dateTo.length === 10) {
        try {
          const from = parse(dateFrom, "dd/MM/yyyy", new Date());
          const to = parse(dateTo, "dd/MM/yyyy", new Date());

          if (isValid(from) && isValid(to)) {
            if (isAfter(from, to)) {
              setError("La fecha inicial debe ser anterior a la fecha final");
            } else {
              setError("");
            }
          }
        } catch {
          // Ignorar errores de parsing durante la escritura
        }
      } else {
        setError("");
      }
    }
  }, [dateFrom, dateTo, validateRange]);

  // Manejar cambio de fecha inicial
  const handleDateFromChange = (value: string) => {
    if (!controlledDateFrom) {
      setInternalDateFrom(value);
    }

    if (onDateFromChange) {
      onDateFromChange(value);
    }

    if (onRangeChange) {
      onRangeChange({ dateFrom: value, dateTo });
    }
  };

  // Manejar cambio de fecha final
  const handleDateToChange = (value: string) => {
    if (!controlledDateTo) {
      setInternalDateTo(value);
    }

    if (onDateToChange) {
      onDateToChange(value);
    }

    if (onRangeChange) {
      onRangeChange({ dateFrom, dateTo: value });
    }
  };

  return (
    <div className={`flex shrin flex-col gap-2 ${className}`}>
      <div className="flex gap-2 items-center">
        <DatePicker
          name="dateFrom"
          placeholder={placeholderFrom}
          value={dateFrom}
          onChange={handleDateFromChange}
          required={required}
        />
        <ArrowRightIcon className="shrink-0 text-muted-foreground" />
        <DatePicker
          name="dateTo"
          placeholder={placeholderTo}
          value={dateTo}
          onChange={handleDateToChange}
          required={required}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
