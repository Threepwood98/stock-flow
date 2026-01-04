import { useState, useMemo } from "react";
import { useOutletContext } from "react-router";
import {
  format,
  startOfMonth,
  endOfMonth,
  parse,
  isValid,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { DateRangePicker } from "~/components/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "~/components/ui/table";
import { Label } from "~/components/ui/label";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { OutletContext } from "~/lib/types/types";
import { ClipboardListIcon } from "lucide-react";
import { writeFile, utils } from "xlsx";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type DailyCashData = {
  date: string;
  dateFormatted: string;
  payMethodsAmount: Record<string, number>;
  withdrawals: number;
  totalSales: number;
};

const payMethods: Array<string> = ["EFECTIVO", "TRANSFERMOVIL", "ENZONA"];

export default function SalesAmountReport() {
  const { sales, withdraws, salesAreas } = useOutletContext<OutletContext>();

  // Estados para filtros
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [salesAreaId, setSalesAreaId] = useState<string>("all");

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  const formatDate = (dateStr: string) => {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
  };

  // Formatear moneda cubana (CUP)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Procesar datos por día
  const dailyData = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return [];

    // Filtrar ventas por rango de fecha y área
    const filteredSales = sales.filter((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());

      if (!isValid(saleDate)) return false;

      const inRange = isWithinInterval(saleDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });

      if (!inRange) return false;

      // Filtro por área de venta
      if (salesAreaId !== "all" && sale.salesAreaId !== salesAreaId) {
        return false;
      }

      return true;
    });

    // Filtrar withdraws (servicios de cambio) por rango de fecha y área
    const filteredWithdraws = withdraws.filter((withdraw) => {
      const withdrawDate = parse(withdraw.date, "yyyy-MM-dd", new Date());

      if (!isValid(withdrawDate)) return false;

      const inRange = isWithinInterval(withdrawDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });

      if (!inRange) return false;

      // Filtro por área de venta
      if (salesAreaId !== "all" && withdraw.salesAreaId !== salesAreaId) {
        return false;
      }

      return true;
    });

    // Agrupar ventas por fecha
    const salesByDate: Record<string, typeof filteredSales> = {};
    filteredSales.forEach((sale) => {
      if (!salesByDate[sale.date]) {
        salesByDate[sale.date] = [];
      }
      salesByDate[sale.date].push(sale);
    });

    // Agrupar withdraws por fecha
    const withdrawsByDate: Record<string, typeof filteredWithdraws> = {};
    filteredWithdraws.forEach((withdraw) => {
      if (!withdrawsByDate[withdraw.date]) {
        withdrawsByDate[withdraw.date] = [];
      }
      withdrawsByDate[withdraw.date].push(withdraw);
    });

    // Obtener todas las fechas únicas que tienen datos (ventas o withdraws)
    const datesWithData = new Set([
      ...Object.keys(salesByDate),
      ...Object.keys(withdrawsByDate),
    ]);

    // Procesar cada día
    const dailyReport: DailyCashData[] = Array.from(datesWithData)
      .sort()
      .map((dayStr) => {
        const day = parse(dayStr, "yyyy-MM-dd", new Date());
        const daySales = salesByDate[dayStr] || [];
        const dayWithdraws = withdrawsByDate[dayStr] || [];

        const payMethodsAmount: Record<string, number> = {};
        let totalSales = 0;

        // Inicializar todos los métodos de pago en 0
        payMethods.forEach((method) => {
          payMethodsAmount[method] = 0;
        });

        // Sumar ventas por método de pago
        daySales.forEach((sale) => {
          payMethodsAmount[sale.payMethod] += sale.saleAmount;
          totalSales += sale.saleAmount;
        });

        // Sumar withdraws del día
        const totalWithdraws = dayWithdraws.reduce(
          (sum, withdraw) => sum + withdraw.amount,
          0
        );

        return {
          date: dayStr,
          dateFormatted: format(day, "EEEE, d 'de' MMMM 'de' yyyy", {
            locale: es,
          }),
          payMethodsAmount,
          withdrawals: totalWithdraws,
          totalSales: totalSales,
        };
      });

    return dailyReport;
  }, [sales, withdraws, dateFrom, dateTo, salesAreaId]);

  // Calcular totales generales
  const totals = useMemo(() => {
    const result: Record<string, number> = {
      withdrawals: 0,
      totalSales: 0,
    };

    // Inicializar métodos de pago
    payMethods.forEach((method) => {
      result[method] = 0;
    });

    // Sumar todos los días
    dailyData.forEach((day) => {
      payMethods.forEach((method) => {
        result[method] += day.payMethodsAmount[method] || 0;
      });
      result.withdrawals += day.withdrawals;
      result.totalSales += day.totalSales;
    });

    return result;
  }, [dailyData]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setSalesAreaId("all");
  };

  const exportToExcel = () => {
    const data = dailyData.map((day) => ({
      Fecha: formatDate(day.date),
      Efectivo: Number(day.payMethodsAmount["EFECTIVO"]) || 0,
      Transfermóvil: Number(day.payMethodsAmount["TRANSFERMOVIL"]) || 0,
      Enzona: Number(day.payMethodsAmount["ENZONA"]) || 0,
      "Caja Extra": Number(day.withdrawals) || 0,
      "Total Ventas": Number(day.totalSales) || 0,
    }));

    // Agregar fila de totales
    data.push({
      Fecha: "TOTALES",
      Efectivo: Number(totals["EFECTIVO"]),
      Transfermóvil: Number(totals["TRANSFERMOVIL"]),
      Enzona: Number(totals["ENZONA"]),
      "Caja Extra": Number(totals.withdrawals),
      "Total Ventas": Number(totals.totalSales),
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Desglose del Importe");

    // Aplicar formato de moneda a las columnas
    const range = utils.decode_range(ws["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = 1; C <= 5; C++) {
        // Columnas B a F (Efectivo a Total Ventas)
        const cellAddress = utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
          ws[cellAddress].z = "$#,##0.00";
        }
      }
    }

    const dateFromFormatted = format(
      parse(dateFrom, "dd/MM/yyyy", new Date()),
      "yyyy-MM-dd"
    );
    const dateToFormatted = format(
      parse(dateTo, "dd/MM/yyyy", new Date()),
      "yyyy-MM-dd"
    );

    writeFile(
      wb,
      `${dateFromFormatted}_${dateToFormatted}_desglose_importe.xlsx`
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text("Desglose del Importe por Día", 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${dateFrom} - ${dateTo}`, 14, 28);

    if (salesAreaId !== "all") {
      const selectedArea = salesAreas.find((sa) => sa.id === salesAreaId);
      if (selectedArea) {
        doc.text(`Área de Venta: ${selectedArea.name}`, 14, 34);
      }
    }

    // Preparar datos para la tabla
    const tableData = dailyData.map((day) => [
      formatDate(day.date),
      formatCurrency(day.payMethodsAmount["EFECTIVO"] || 0),
      formatCurrency(day.payMethodsAmount["TRANSFERMOVIL"] || 0),
      formatCurrency(day.payMethodsAmount["ENZONA"] || 0),
      formatCurrency(day.withdrawals),
      formatCurrency(day.totalSales),
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [
        ["Fecha", "Efectivo", "Transfermóvil", "Enzona", "Caja Extra", "Total"],
      ],
      body: tableData,
      foot: [
        [
          "TOTALES",
          formatCurrency(totals["EFECTIVO"]),
          formatCurrency(totals["TRANSFERMOVIL"]),
          formatCurrency(totals["ENZONA"]),
          formatCurrency(totals.withdrawals),
          formatCurrency(totals.totalSales),
        ],
      ],
      startY: salesAreaId !== "all" ? 40 : 35,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: "right",
      },
      headStyles: {
        fillColor: [68, 114, 196],
        fontStyle: "bold",
        halign: "center",
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: "bold",
        halign: "right",
      },
      columnStyles: {
        0: { halign: "left" }, // Fecha alineada a la izquierda
      },
    });

    // Descargar
    doc.save(`desglose_importe_${dateFrom}_${dateTo}.pdf`);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardAction>
            <Button onClick={clearFilters} variant="outline">
              Limpiar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent
          className={`grid gap-4 ${salesAreas.length > 1 ? "grid-cols-2" : ""}`}
        >
          <div className="grid gap-2">
            <Label className="pl-1">Rango de Fecha</Label>
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </div>
          {salesAreas.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="salesAreaId" className="pl-1">
                Área de Venta
              </Label>
              <ComboboxPlus
                name="salesAreaId"
                className="w-full"
                options={[
                  { value: "all", label: "Todas las áreas" },
                  ...salesAreas.map((sa) => ({
                    value: sa.id,
                    label: sa.name,
                  })),
                ]}
                value={salesAreaId}
                onChange={(value) => setSalesAreaId(value)}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Desglose del Importe</CardTitle>
          <CardAction className="grid grid-cols-2 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={dailyData.length === 0}
              variant="outline"
            >
              <IconFileTypeXls />
              Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={true}
              // disabled={dailyData.length === 0}
              variant="outline"
            >
              <IconFileTypePdf />
              PDF
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="text-right font-semibold">
                  Efectivo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Transfermóvil
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Enzona
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Caja Extra
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Total Ventas
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <ClipboardListIcon className="size-32" />
                      <p className="font-semibold">
                        No hay datos disponibles para el rango seleccionado.
                      </p>
                      <Button onClick={clearFilters} variant="outline">
                        Limpiar filtros
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                dailyData.map((day, index) => (
                  <TableRow
                    key={day.date}
                    className={index % 2 === 0 ? "bg-secondary" : ""}
                  >
                    <TableCell>{formatDate(day.date)}</TableCell>
                    {payMethods.map((method) => (
                      <TableCell key={method} className="text-right">
                        {day.payMethodsAmount[method] > 0
                          ? formatCurrency(day.payMethodsAmount[method])
                          : "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {day.withdrawals > 0
                        ? formatCurrency(day.withdrawals)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(day.totalSales)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {dailyData.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">TOTALES</TableCell>
                  {payMethods.map((method) => (
                    <TableCell
                      key={method}
                      className="text-right font-semibold"
                    >
                      {formatCurrency(totals[method] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.withdrawals)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.totalSales)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
