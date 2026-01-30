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
import type { OutletContext, Category, Product } from "@/lib/types/types";
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
import { Switch } from "~/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

type CategoryBalance = {
  categoryId: string;
  categoryName: string;
  saldoInicial: number;
  compras: number;
  trasladosRecibidos: number;
  ventas: number;
  trasladosEnviados: number;
  saldoFinal: number;
  variacionPrecio: number;
};

type GroupedByGeneralCategory = {
  generalCategoryId: string;
  generalCategoryName: string;
  categories: CategoryBalance[];
  totalSaldoInicial: number;
  totalCompras: number;
  totalTrasladosRecibidos: number;
  totalVentas: number;
  totalTrasladosEnviados: number;
  totalSaldoFinal: number;
  totalVariacionPrecio: number;
};

export default function InventoryBalanceReport() {
  const {
    sales,
    inflows,
    outflows,
    salesAreas,
    warehouses,
    categories,
    products,
  } = useOutletContext<OutletContext>();

  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "dd/MM/yyyy"),
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "dd/MM/yyyy"),
  );
  const [generalCategoryId, setGeneralCategoryId] = useState<string>("all");

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
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

  // Crear mapa de nombres de categorías generales
  const generalCategoryNames = useMemo(() => {
    const names: Record<string, string> = {};
    categories.forEach((cat) => {
      if (cat.generalCategoryId && !names[cat.generalCategoryId]) {
        // Usar el nombre real de la categoría general si está disponible
        names[cat.generalCategoryId] =
          (cat as any).generalCategory?.name ||
          `Categoría ${cat.generalCategoryId}`;
      }
    });
    names["no-category"] = "Sin Categoría General";
    return names;
  }, [categories]);

  // Obtener categorías generales únicas
  const generalCategories = useMemo(() => {
    return Object.keys(generalCategoryNames);
  }, [generalCategoryNames]);

  // Procesar datos del reporte de cuadre de inventario
  const inventoryBalanceByGeneralCategory = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return [];

    // Obtener todas las transacciones relevantes
    const allInflows = inflows;
    const allOutflows = outflows;
    const allSales = sales;

    // Agrupar por categoría (individual)
    const categoryBalance: Record<string, CategoryBalance> = {};

    // Inicializar todas las categorías
    categories.forEach((category) => {
      categoryBalance[category.id] = {
        categoryId: category.id,
        categoryName: category.name,
        saldoInicial: 0,
        compras: 0,
        trasladosRecibidos: 0,
        ventas: 0,
        trasladosEnviados: 0,
        saldoFinal: 0,
        variacionPrecio: 0,
      };
    });

    // Calcular Saldo Inicial (transacciones antes de la fecha inicial)
    const initialDate = startOfDay(fromDate);

    // Inflows antes de fecha inicial
    allInflows.forEach((inflow) => {
      const inflowDate = parse(inflow.date, "yyyy-MM-dd", new Date());
      if (isValid(inflowDate) && inflowDate < initialDate) {
        const product = products.find((p) => p.id === inflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          categoryBalance[product.categoryId].saldoInicial += inflow.costAmount;
        }
      }
    });

    // Outflows antes de fecha inicial
    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (isValid(outflowDate) && outflowDate < initialDate) {
        const product = products.find((p) => p.id === outflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          if (outflow.outType === "VENTA") {
            categoryBalance[product.categoryId].saldoInicial -=
              outflow.costAmount;
          } else if (outflow.outType === "TRASLADO") {
            categoryBalance[product.categoryId].saldoInicial -=
              outflow.costAmount;
          }
        }
      }
    });

    // Sales antes de fecha inicial
    allSales.forEach((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());
      if (isValid(saleDate) && saleDate < initialDate) {
        const product = products.find((p) => p.id === sale.productId);
        if (product && categoryBalance[product.categoryId]) {
          categoryBalance[product.categoryId].saldoInicial -= sale.costAmount;
        }
      }
    });

    // Calcular transacciones dentro del rango de fechas
    const rangeStart = startOfDay(fromDate);
    const rangeEnd = endOfDay(toDate);

    // Compras (Inflows en el rango)
    allInflows.forEach((inflow) => {
      const inflowDate = parse(inflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(inflowDate) &&
        isWithinInterval(inflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        const product = products.find((p) => p.id === inflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          categoryBalance[product.categoryId].compras += inflow.costAmount;
        }
      }
    });

    // Traslados Recibidos (Outflows tipo TRASLADO que entran a esta tienda)
    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(outflowDate) &&
        isWithinInterval(outflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        if (outflow.outType === "TRASLADO" && outflow.destinationStoreId) {
          const product = products.find((p) => p.id === outflow.productId);
          if (product && categoryBalance[product.categoryId]) {
            categoryBalance[product.categoryId].trasladosRecibidos +=
              outflow.costAmount;
          }
        }
      }
    });

    // Ventas (Sales + Outflows tipo VENTA en el rango)
    // Sales
    allSales.forEach((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());
      if (
        isValid(saleDate) &&
        isWithinInterval(saleDate, { start: rangeStart, end: rangeEnd })
      ) {
        const product = products.find((p) => p.id === sale.productId);
        if (product && categoryBalance[product.categoryId]) {
          categoryBalance[product.categoryId].ventas += sale.costAmount;
        }
      }
    });

    // Outflows tipo VENTA
    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(outflowDate) &&
        isWithinInterval(outflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        if (outflow.outType === "VENTA") {
          const product = products.find((p) => p.id === outflow.productId);
          if (product && categoryBalance[product.categoryId]) {
            categoryBalance[product.categoryId].ventas += outflow.costAmount;
          }
        }
      }
    });

    // Traslados Enviados (Outflows tipo TRASLADO que salen de esta tienda)
    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(outflowDate) &&
        isWithinInterval(outflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        if (outflow.outType === "TRASLADO") {
          const product = products.find((p) => p.id === outflow.productId);
          if (product && categoryBalance[product.categoryId]) {
            categoryBalance[product.categoryId].trasladosEnviados +=
              outflow.costAmount;
          }
        }
      }
    });

    // Calcular Saldo Final y Variación de Precio para cada categoría
    Object.values(categoryBalance).forEach((category) => {
      category.saldoFinal =
        category.saldoInicial +
        category.compras +
        category.trasladosRecibidos -
        category.ventas -
        category.trasladosEnviados;
      category.variacionPrecio = category.saldoFinal - category.saldoInicial;
    });

    // Agrupar por categoría general
    const groupedByGeneralCategory: Record<string, GroupedByGeneralCategory> =
      {};

    Object.values(categoryBalance).forEach((category) => {
      const generalCategoryId =
        categories.find((c) => c.id === category.categoryId)
          ?.generalCategoryId || "no-category";
      const generalCategoryName = generalCategoryNames[generalCategoryId];

      if (!groupedByGeneralCategory[generalCategoryId]) {
        groupedByGeneralCategory[generalCategoryId] = {
          generalCategoryId,
          generalCategoryName,
          categories: [],
          totalSaldoInicial: 0,
          totalCompras: 0,
          totalTrasladosRecibidos: 0,
          totalVentas: 0,
          totalTrasladosEnviados: 0,
          totalSaldoFinal: 0,
          totalVariacionPrecio: 0,
        };
      }

      groupedByGeneralCategory[generalCategoryId].categories.push(category);
      groupedByGeneralCategory[generalCategoryId].totalSaldoInicial +=
        category.saldoInicial;
      groupedByGeneralCategory[generalCategoryId].totalCompras +=
        category.compras;
      groupedByGeneralCategory[generalCategoryId].totalTrasladosRecibidos +=
        category.trasladosRecibidos;
      groupedByGeneralCategory[generalCategoryId].totalVentas +=
        category.ventas;
      groupedByGeneralCategory[generalCategoryId].totalTrasladosEnviados +=
        category.trasladosEnviados;
      groupedByGeneralCategory[generalCategoryId].totalSaldoFinal +=
        category.saldoFinal;
      groupedByGeneralCategory[generalCategoryId].totalVariacionPrecio +=
        category.variacionPrecio;
    });

    // Ordenar categorías dentro de cada categoría general
    Object.values(groupedByGeneralCategory).forEach((generalCat) => {
      generalCat.categories.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName),
      );
    });

    // Filtrar por categoría general si es necesario
    let result = Object.values(groupedByGeneralCategory);
    if (generalCategoryId !== "all") {
      result = result.filter(
        (generalCat) => generalCat.generalCategoryId === generalCategoryId,
      );
    }

    // Ordenar por nombre de categoría general
    return result.sort((a, b) =>
      a.generalCategoryName.localeCompare(b.generalCategoryName),
    );
  }, [
    inflows,
    outflows,
    sales,
    categories,
    products,
    dateFrom,
    dateTo,
    generalCategoryId,
    generalCategoryNames,
  ]);

  // Calcular totales generales
  const grandTotals = useMemo(() => {
    return inventoryBalanceByGeneralCategory.reduce(
      (acc: any, generalCategory: any) => ({
        saldoInicial: acc.saldoInicial + generalCategory.totalSaldoInicial,
        compras: acc.compras + generalCategory.totalCompras,
        trasladosRecibidos:
          acc.trasladosRecibidos + generalCategory.totalTrasladosRecibidos,
        ventas: acc.ventas + generalCategory.totalVentas,
        trasladosEnviados:
          acc.trasladosEnviados + generalCategory.totalTrasladosEnviados,
        saldoFinal: acc.saldoFinal + generalCategory.totalSaldoFinal,
        variacionPrecio:
          acc.variacionPrecio + generalCategory.totalVariacionPrecio,
      }),
      {
        saldoInicial: 0,
        compras: 0,
        trasladosRecibidos: 0,
        ventas: 0,
        trasladosEnviados: 0,
        saldoFinal: 0,
        variacionPrecio: 0,
      },
    );
  }, [inventoryBalanceByGeneralCategory]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setGeneralCategoryId("all");
  };

  const exportToExcel = () => {
    const data: any[] = [];

    inventoryBalanceByGeneralCategory.forEach((generalCategory: any) => {
      // Header de categoría general
      data.push({
        "ID Categoría": `========== ${generalCategory.generalCategoryId}: ${generalCategory.generalCategoryName} ==========`,
        "Nombre Categoría": "",
        "Saldo Inicial": "",
        Compras: "",
        "Traslados Recibidos": "",
        Ventas: "",
        "Traslados Enviados": "",
        "Saldo Final": "",
        "Variación de Precio": "",
      });

      // Categorías dentro de la categoría general
      generalCategory.categories.forEach((category: any) => {
        data.push({
          "ID Categoría": category.categoryId,
          "Nombre Categoría": category.categoryName,
          "Saldo Inicial": category.saldoInicial,
          Compras: category.compras,
          "Traslados Recibidos": category.trasladosRecibidos,
          Ventas: category.ventas,
          "Traslados Enviados": category.trasladosEnviados,
          "Saldo Final": category.saldoFinal,
          "Variación de Precio": category.variacionPrecio,
        });
      });

      // Subtotal de categoría general
      data.push({
        "ID Categoría": "SUBTOTAL",
        "Nombre Categoría": "",
        "Saldo Inicial": generalCategory.totalSaldoInicial,
        Compras: generalCategory.totalCompras,
        "Traslados Recibidos": generalCategory.totalTrasladosRecibidos,
        Ventas: generalCategory.totalVentas,
        "Traslados Enviados": generalCategory.totalTrasladosEnviados,
        "Saldo Final": generalCategory.totalSaldoFinal,
        "Variación de Precio": generalCategory.totalVariacionPrecio,
      });

      // Línea en blanco
      data.push({});
    });

    // Total general
    data.push({
      "ID Categoría": "TOTAL GENERAL",
      "Nombre Categoría": "",
      "Saldo Inicial": grandTotals.saldoInicial,
      Compras: grandTotals.compras,
      "Traslados Recibidos": grandTotals.trasladosRecibidos,
      Ventas: grandTotals.ventas,
      "Traslados Enviados": grandTotals.trasladosEnviados,
      "Saldo Final": grandTotals.saldoFinal,
      "Variación de Precio": grandTotals.variacionPrecio,
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Cuadre de Inventario");

    writeFile(
      wb,
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo,
      )}_cuadre_inventario.xlsx`,
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Cuadre del Inventario al Costo", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${dateFrom} - ${dateTo}`, 14, 22);

    let startY = 28;

    inventoryBalanceByGeneralCategory.forEach((generalCategory: any) => {
      // Verificar si hay espacio, si no, agregar nueva página
      if (startY > 160) {
        doc.addPage();
        startY = 15;
      }

      // Header de categoría general
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${generalCategory.generalCategoryId}: ${generalCategory.generalCategoryName}`,
        14,
        startY,
      );
      startY += 7;

      // Tabla de categorías
      const tableData = generalCategory.categories.map((category: any) => [
        category.categoryId,
        category.categoryName,
        formatCurrency(category.saldoInicial, "cost"),
        formatCurrency(category.compras, "cost"),
        formatCurrency(category.trasladosRecibidos, "cost"),
        formatCurrency(category.ventas, "cost"),
        formatCurrency(category.trasladosEnviados, "cost"),
        formatCurrency(category.saldoFinal, "cost"),
        formatCurrency(category.variacionPrecio, "cost"),
      ]);

      autoTable(doc, {
        head: [
          [
            "ID",
            "Categoría",
            "Saldo Inicial",
            "Compras",
            "Traslados Recibidos",
            "Ventas",
            "Traslados Enviados",
            "Saldo Final",
            "Variación de Precio",
          ],
        ],
        body: tableData,
        foot: [
          [
            "SUBTOTAL",
            "",
            formatCurrency(generalCategory.totalSaldoInicial, "cost"),
            formatCurrency(generalCategory.totalCompras, "cost"),
            formatCurrency(generalCategory.totalTrasladosRecibidos, "cost"),
            formatCurrency(generalCategory.totalVentas, "cost"),
            formatCurrency(generalCategory.totalTrasladosEnviados, "cost"),
            formatCurrency(generalCategory.totalSaldoFinal, "cost"),
            formatCurrency(generalCategory.totalVariacionPrecio, "cost"),
          ],
        ],
        startY: startY,
        styles: { fontSize: 8, cellPadding: 2 },
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
          0: { cellWidth: 15 },
          1: { cellWidth: 35 },
          2: { halign: "right", cellWidth: 20 },
          3: { halign: "right", cellWidth: 18 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 18 },
          6: { halign: "right", cellWidth: 22 },
          7: { halign: "right", cellWidth: 20 },
          8: { halign: "right", cellWidth: 22 },
        },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    // Total general
    if (startY > 240) {
      doc.addPage();
      startY = 15;
    }

    autoTable(doc, {
      body: [
        [
          "TOTAL GENERAL",
          "",
          formatCurrency(grandTotals.saldoInicial, "cost"),
          formatCurrency(grandTotals.compras, "cost"),
          formatCurrency(grandTotals.trasladosRecibidos, "cost"),
          formatCurrency(grandTotals.ventas, "cost"),
          formatCurrency(grandTotals.trasladosEnviados, "cost"),
          formatCurrency(grandTotals.saldoFinal, "cost"),
          formatCurrency(grandTotals.variacionPrecio, "cost"),
        ],
      ],
      startY: startY,
      styles: { fontSize: 9, cellPadding: 2, fontStyle: "bold" },
      bodyStyles: {
        fillColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { halign: "right", cellWidth: 20 },
        3: { halign: "right", cellWidth: 18 },
        4: { halign: "right", cellWidth: 22 },
        5: { halign: "right", cellWidth: 18 },
        6: { halign: "right", cellWidth: 22 },
        7: { halign: "right", cellWidth: 20 },
        8: { halign: "right", cellWidth: 22 },
      },
    });

    doc.save(
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo,
      )}_cuadre_inventario.pdf`,
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filtros</CardTitle>
          <CardAction>
            <Button onClick={clearFilters} variant="outline">
              Limpiar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="grid gap-2">
            <Label className="pl-1">Rango de Fecha</Label>
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </div>
          <div className="grid gap-2">
            <Label className="pl-1">Tipo de Saldo</Label>
            <RadioGroup defaultValue="costPrice" className="w-fit flex">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="r1" value="costPrice" />
                <Label htmlFor="r1">Precio Costo</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="r2" value="salePrice" />
                <Label htmlFor="r2">Precio Venta</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label className="pl-1">Categoría</Label>
            <div className="flex items-center gap-2">
              <Switch />
              <Label>Mostrar</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cuadre del Inventario</CardTitle>
          <CardAction className="grid grid-cols-2 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={inventoryBalanceByGeneralCategory.length === 0}
              variant="outline"
            >
              <IconFileTypeXls />
              Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={inventoryBalanceByGeneralCategory.length === 0}
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
                <TableHead className="font-semibold">ID Categoría</TableHead>
                <TableHead className="font-semibold">
                  Nombre Categoría
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Saldo Inicial
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Compras
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Traslados Recibidos
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Ventas
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Traslados Enviados
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Saldo Final
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Variación de Precio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryBalanceByGeneralCategory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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
                inventoryBalanceByGeneralCategory.map(
                  (generalCategory: any) => (
                    <>
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center font-semibold bg-primary/10"
                        >
                          {generalCategory.generalCategoryId}:{" "}
                          {generalCategory.generalCategoryName}
                        </TableCell>
                      </TableRow>
                      {generalCategory.categories.map(
                        (category: any, index: number) => (
                          <TableRow
                            key={category.categoryId}
                            className={index % 2 === 0 ? "bg-secondary" : ""}
                          >
                            <TableCell>{category.categoryId}</TableCell>
                            <TableCell>{category.categoryName}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(category.saldoInicial, "cost")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(category.compras, "cost")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.trasladosRecibidos,
                                "cost",
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(category.ventas, "cost")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.trasladosEnviados,
                                "cost",
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(category.saldoFinal, "cost")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(category.variacionPrecio, "cost")}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                      <TableRow className="font-semibold bg-muted">
                        <TableCell colSpan={2}>SUBTOTAL</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalSaldoInicial,
                            "cost",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(generalCategory.totalCompras, "cost")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalTrasladosRecibidos,
                            "cost",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(generalCategory.totalVentas, "cost")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalTrasladosEnviados,
                            "cost",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalSaldoFinal,
                            "cost",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalVariacionPrecio,
                            "cost",
                          )}
                        </TableCell>
                      </TableRow>
                    </>
                  ),
                )
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold bg-secondary">
                <TableCell colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.saldoInicial, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.compras, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.trasladosRecibidos, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.ventas, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.trasladosEnviados, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.saldoFinal, "cost")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotals.variacionPrecio, "cost")}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
