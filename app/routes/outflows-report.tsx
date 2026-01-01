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
import { DateRangePicker } from "~/components/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Label } from "~/components/ui/label";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { OutletContext } from "@/types/types";
import { PackageIcon } from "lucide-react";
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

export default function OutflowsReport() {
  const { outflows, warehouses } = useOutletContext<OutletContext>();

  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [warehouseId, setWarehouseId] = useState<string>("all");

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  const formatDate = (dateStr: string) => {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
  };

  const formatDateForFilename = (dateStr: string) => {
    const date = parse(dateStr, "dd/MM/yyyy", new Date());
    return format(date, "yyyy-MM-dd");
  };

  const formatCurrency = (value: number, type?: string) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: type === "cost" ? 6 : 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const outflowsByDateRange = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return [];

    const filteredOutflows = outflows.filter((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());

      if (!isValid(outflowDate)) return false;

      const inRange = isWithinInterval(outflowDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });

      if (!inRange) return false;

      if (warehouseId !== "all" && outflow.warehouseId !== warehouseId) {
        return false;
      }

      return true;
    });

    return filteredOutflows.sort((a, b) => b.date.localeCompare(a.date));
  }, [outflows, dateFrom, dateTo, warehouseId]);

  const totals = useMemo(() => {
    return outflowsByDateRange.reduce(
      (acc, outflow) => ({
        quantity: acc.quantity + outflow.quantity,
        costAmount: acc.costAmount + outflow.costAmount,
        saleAmount: acc.saleAmount + outflow.saleAmount,
      }),
      { quantity: 0, costAmount: 0, saleAmount: 0 }
    );
  }, [outflowsByDateRange]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setWarehouseId("all");
  };

  const exportToExcel = () => {
    const data = outflowsByDateRange.map((outflow) => ({
      Fecha: formatDate(outflow.date),
      Almacén: outflow.warehouseName,
      "Tipo de Salida": outflow.outType,
      Destino: outflow.destinationName || "-",
      "Método de Pago": outflow.payMethod || "-",
      "No. Salida": outflow.outNumber,
      Producto: outflow.productName,
      Cantidad: outflow.quantity,
      "Importe al Costo": outflow.costAmount,
      "Importe a la Venta": outflow.saleAmount,
    }));

    // Agregar fila de totales
    data.push({
      Fecha: "TOTALES",
      Almacén: "",
      "Tipo de Salida": "",
      Destino: "",
      "Método de Pago": "",
      "No. Salida": "",
      Producto: "",
      Cantidad: totals.quantity,
      "Importe al Costo": totals.costAmount,
      "Importe a la Venta": totals.saleAmount,
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Entradas");

    // Aplicar formato de moneda
    const range = utils.decode_range(ws["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      // Columnas I y J (Importe al Costo e Importe a la Venta)
      for (let C = 9; C <= 10; C++) {
        const cellAddress = utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
          ws[cellAddress].z = "$#,##0.00";
        }
      }
    }

    writeFile(
      wb,
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo
      )}_entradas.xlsx`
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Reporte de Entradas al Almacén", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${dateFrom} - ${dateTo}`, 14, 22);

    if (warehouseId !== "all") {
      const warehouse = warehouses.find((w) => w.id === warehouseId);
      if (warehouse) {
        doc.text(`Almacén: ${warehouse.name}`, 14, 28);
      }
    }

    const tableData = outflowsByDateRange.map((outflow) => [
      formatDate(outflow.date),
      outflow.outType,
      outflow.destinationName || "-",
      outflow.payMethod || "-",
      outflow.outNumber,
      outflow.productName,
      outflow.quantity.toString(),
      formatCurrency(outflow.costAmount),
      formatCurrency(outflow.saleAmount),
    ]);

    autoTable(doc, {
      head: [
        [
          "Fecha",
          "Tipo",
          "Proveedor",
          "Pago",
          "Factura",
          "No. Ent.",
          "Producto",
          "Cant.",
          "Imp. Costo",
          "Imp. Venta",
        ],
      ],
      body: tableData,
      foot: [
        [
          "TOTALES",
          "",
          "",
          "",
          "",
          "",
          "",
          totals.quantity.toString(),
          formatCurrency(totals.costAmount),
          formatCurrency(totals.saleAmount),
        ],
      ],
      startY: warehouseId !== "all" ? 32 : 26,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [68, 114, 196],
        fontStyle: "bold",
        halign: "center",
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 45 },
        7: { halign: "right", cellWidth: 15 },
        8: { halign: "right", cellWidth: 25 },
        9: { halign: "right", cellWidth: 25 },
      },
    });

    doc.save(
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo
      )}_entradas.pdf`
    );
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
          className={`grid gap-4 ${warehouses.length > 1 ? "grid-cols-2" : ""}`}
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
          {warehouses.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="warehouseId" className="pl-1">
                Almacén
              </Label>
              <ComboboxPlus
                name="warehouseId"
                className="w-full"
                options={[
                  { value: "all", label: "Todos los almacenes" },
                  ...warehouses.map((sa) => ({
                    value: sa.id,
                    label: sa.name,
                  })),
                ]}
                value={warehouseId}
                onChange={(value) => setWarehouseId(value)}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Salidas del Almacén</CardTitle>
          <CardAction className="grid grid-cols-2 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={outflowsByDateRange.length === 0}
              variant="outline"
            >
              <IconFileTypeXls />
              Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={outflowsByDateRange.length === 0}
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
                <TableHead className="font-semibold">Almacén</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Destino</TableHead>
                <TableHead className="font-semibold">Método de Pago</TableHead>
                <TableHead className="font-semibold">No. Factura</TableHead>
                <TableHead className="font-semibold">No. Entrada</TableHead>
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="text-right font-semibold">
                  Cantidad
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe al Costo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe a la Venta
                </TableHead>
                <TableHead className="font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outflowsByDateRange.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <PackageIcon className="size-32" />
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
                outflowsByDateRange.map((inflow, index) => (
                  <TableRow
                    key={inflow.id}
                    className={index % 2 === 0 ? "bg-secondary" : ""}
                  >
                    <TableCell>{formatDate(inflow.date)}</TableCell>
                    <TableCell>{inflow.warehouseName}</TableCell>
                    <TableCell>{inflow.outType}</TableCell>
                    <TableCell>{inflow.destinationName}</TableCell>
                    <TableCell>{inflow.payMethod}</TableCell>
                    <TableCell>{inflow.outNumber}</TableCell>
                    <TableCell>{inflow.productName}</TableCell>
                    <TableCell className="text-right">
                      {inflow.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(inflow.costAmount, "cost")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(inflow.saleAmount)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              )}
            </TableBody>
            {outflowsByDateRange.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className="font-semibold">
                    TOTALES
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totals.quantity}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.costAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.saleAmount)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
