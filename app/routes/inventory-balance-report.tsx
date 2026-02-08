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
import { BoxesIcon, PackageIcon } from "lucide-react";
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
  const [showCategoryName, setShowCategoryName] = useState<boolean>(false);
  const [salesAreaId, setSalesAreaId] = useState<string>("all");
  const [balanceType, setBalanceType] = useState<string>("salePrice");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [locationType, setLocationType] = useState<string>("store"); // "store", "warehouse", "salesArea"

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

  // Procesar datos del reporte de cuadre de inventario
  const inventoryBalanceByGeneralCategory = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return [];

    // Filtrar transacciones según la ubicación seleccionada
    const filterByLocation = (transaction: any, isOutflow: boolean = false) => {
      if (locationFilter === "all") return true;

      if (locationType === "store") {
        return true; // Para "store" mostramos todo de la tienda
      }

      if (locationType === "warehouse" && isOutflow) {
        // Para outflows, filtramos por warehouse de origen
        return transaction.warehouseId === locationFilter;
      }

      if (locationType === "salesArea") {
        // Para sales y destinationSalesArea de outflows
        if (transaction.salesAreaId) {
          return transaction.salesAreaId === locationFilter;
        }
        if (transaction.destinationSalesAreaId) {
          return transaction.destinationSalesAreaId === locationFilter;
        }
      }

      return false;
    };

    const filteredSales = sales.filter((sale) => filterByLocation(sale));
    const filteredOutflows = outflows.filter((outflow) =>
      filterByLocation(outflow, true),
    );

    // Inflows se filtran por warehouse si se selecciona un warehouse específico
    const filteredInflows =
      locationType === "warehouse" && locationFilter !== "all"
        ? inflows.filter((inflow) => inflow.warehouseId === locationFilter)
        : inflows;

    const allInflows = filteredInflows;
    const allOutflows = filteredOutflows;
    const allSales = filteredSales;

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
      };
    });

    const rangeStart = startOfDay(fromDate);
    const rangeEnd = endOfDay(toDate);
    const today = endOfDay(new Date());

    warehouses.forEach((warehouse) => {
      if (
        locationType === "store" ||
        (locationType === "warehouse" &&
          (locationFilter === "all" || warehouse.id === locationFilter))
      ) {
        warehouse.warehouseInventories.forEach((inventory: any) => {
          const product = products.find((p) => p.id === inventory.productId);
          if (product && categoryBalance[product.categoryId]) {
            const quantity =
              typeof inventory.quantity === "number"
                ? inventory.quantity
                : parseFloat(inventory.quantity?.toString() || "0");
            const amount =
              balanceType === "costPrice"
                ? product.costPrice * quantity
                : product.salePrice * quantity;
            categoryBalance[product.categoryId].saldoInicial += amount;
          }
        });
      }
    });

    salesAreas.forEach((salesArea) => {
      if (
        locationType === "store" ||
        (locationType === "salesArea" &&
          (locationFilter === "all" || salesArea.id === locationFilter))
      ) {
        salesArea.salesAreaInventories.forEach((inventory: any) => {
          const product = products.find((p) => p.id === inventory.productId);
          if (product && categoryBalance[product.categoryId]) {
            const quantity =
              typeof inventory.quantity === "number"
                ? inventory.quantity
                : parseFloat(inventory.quantity?.toString() || "0");
            const amount =
              balanceType === "costPrice"
                ? product.costPrice * quantity
                : product.salePrice * quantity;
            categoryBalance[product.categoryId].saldoInicial += amount;
          }
        });
      }
    });

    // - Inflows (restar compras desde dateFrom hasta hoy)
    allInflows.forEach((inflow) => {
      const inflowDate = parse(inflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(inflowDate) &&
        isWithinInterval(inflowDate, { start: rangeStart, end: today })
      ) {
        const product = products.find((p) => p.id === inflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          const amount =
            balanceType === "costPrice" ? inflow.costAmount : inflow.saleAmount;
          categoryBalance[product.categoryId].saldoInicial -= amount;
        }
      }
    });

    // + Sales (sumar ventas desde dateFrom hasta hoy)
    allSales.forEach((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());
      if (
        isValid(saleDate) &&
        isWithinInterval(saleDate, { start: rangeStart, end: today })
      ) {
        const product = products.find((p) => p.id === sale.productId);
        if (product && categoryBalance[product.categoryId]) {
          const amount =
            balanceType === "costPrice" ? sale.costAmount : sale.saleAmount;
          categoryBalance[product.categoryId].saldoInicial += amount;
        }
      }
    });

    // + Outflows tipo VENTA y TRASLADO (sumar desde dateFrom hasta hoy)
    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(outflowDate) &&
        isWithinInterval(outflowDate, { start: rangeStart, end: today })
      ) {
        if (outflow.outType === "VENTA" || outflow.outType === "TRASLADO") {
          const product = products.find((p) => p.id === outflow.productId);
          if (product && categoryBalance[product.categoryId]) {
            const amount =
              balanceType === "costPrice"
                ? outflow.costAmount
                : outflow.saleAmount;
            categoryBalance[product.categoryId].saldoInicial += amount;
          }
        }
      }
    });

    allInflows.forEach((inflow) => {
      const inflowDate = parse(inflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(inflowDate) &&
        isWithinInterval(inflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        const product = products.find((p) => p.id === inflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          const amount =
            balanceType === "costPrice" ? inflow.costAmount : inflow.saleAmount;
          if (inflow.inType === "FACTURA") {
            categoryBalance[product.categoryId].compras += amount;
          } else {
            categoryBalance[product.categoryId].trasladosRecibidos += amount;
          }
        }
      }
    });

    allSales.forEach((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());
      if (
        isValid(saleDate) &&
        isWithinInterval(saleDate, { start: rangeStart, end: rangeEnd })
      ) {
        const product = products.find((p) => p.id === sale.productId);
        if (product && categoryBalance[product.categoryId]) {
          const amount =
            balanceType === "costPrice" ? sale.costAmount : sale.saleAmount;
          categoryBalance[product.categoryId].ventas += amount;
        }
      }
    });

    allOutflows.forEach((outflow) => {
      const outflowDate = parse(outflow.date, "yyyy-MM-dd", new Date());
      if (
        isValid(outflowDate) &&
        isWithinInterval(outflowDate, { start: rangeStart, end: rangeEnd })
      ) {
        const product = products.find((p) => p.id === outflow.productId);
        if (product && categoryBalance[product.categoryId]) {
          const amount =
            balanceType === "costPrice"
              ? outflow.costAmount
              : outflow.saleAmount;
          if (outflow.outType === "VENTA") {
            categoryBalance[product.categoryId].ventas += amount;
          } else if (outflow.outType === "TRASLADO") {
            categoryBalance[product.categoryId].trasladosEnviados += amount;
          }
        }
      }
    });

    // Calcular Saldo Final para cada categoría
    Object.values(categoryBalance).forEach((category) => {
      category.saldoFinal =
        category.saldoInicial +
        category.compras +
        category.trasladosRecibidos -
        category.ventas -
        category.trasladosEnviados;
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

    // Ordenar por ID de categoría general alfabéticamente
    return result.sort((a, b) =>
      a.generalCategoryId.localeCompare(b.generalCategoryId),
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
    salesAreaId,
    balanceType,
    locationFilter,
    locationType,
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
      }),
      {
        saldoInicial: 0,
        compras: 0,
        trasladosRecibidos: 0,
        ventas: 0,
        trasladosEnviados: 0,
        saldoFinal: 0,
      },
    );
  }, [inventoryBalanceByGeneralCategory]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setGeneralCategoryId("all");
    setSalesAreaId("all");
    setBalanceType("costPrice");
    setLocationFilter("all");
    setLocationType("store");
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
    const locationText =
      locationType === "store"
        ? "Toda la Tienda"
        : locationType === "warehouse"
          ? warehouses.find((w) => w.id === locationFilter)?.name || "Almacén"
          : salesAreas.find((sa) => sa.id === locationFilter)?.name ||
            "Área de Venta";

    doc.text(
      `Cuadre del Inventario al ${balanceType === "costPrice" ? "Costo" : "Precio Venta"} - ${locationText}`,
      14,
      15,
    );
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
        formatCurrency(
          category.saldoInicial,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
        formatCurrency(
          category.compras,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
        formatCurrency(
          category.trasladosRecibidos,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
        formatCurrency(
          category.ventas,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
        formatCurrency(
          category.trasladosEnviados,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
        formatCurrency(
          category.saldoFinal,
          balanceType === "costPrice" ? "cost" : undefined,
        ),
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
          ],
        ],
        body: tableData,
        foot: [
          [
            "SUBTOTAL",
            "",
            formatCurrency(
              generalCategory.totalSaldoInicial,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
            formatCurrency(
              generalCategory.totalCompras,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
            formatCurrency(
              generalCategory.totalTrasladosRecibidos,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
            formatCurrency(
              generalCategory.totalVentas,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
            formatCurrency(
              generalCategory.totalTrasladosEnviados,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
            formatCurrency(
              generalCategory.totalSaldoFinal,
              balanceType === "costPrice" ? "cost" : undefined,
            ),
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
          formatCurrency(
            grandTotals.saldoInicial,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
          formatCurrency(
            grandTotals.compras,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
          formatCurrency(
            grandTotals.trasladosRecibidos,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
          formatCurrency(
            grandTotals.ventas,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
          formatCurrency(
            grandTotals.trasladosEnviados,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
          formatCurrency(
            grandTotals.saldoFinal,
            balanceType === "costPrice" ? "cost" : undefined,
          ),
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
            <Label htmlFor="locationType" className="pl-1">
              Ubicación
            </Label>
            <ComboboxPlus
              name="locationType"
              className="w-full min-w-0 sm:min-w-40"
              options={[
                { value: "store", label: "Tienda" },
                { value: "warehouse", label: "Almacén" },
                { value: "salesArea", label: "Área de Venta" },
              ]}
              value={locationType}
              onChange={(value) => {
                setLocationType(value);
                setLocationFilter("all"); // Reset filter when type changes
              }}
            />
          </div>
          {((locationType === "warehouse" && warehouses.length > 0) ||
            (locationType === "salesArea" && salesAreas.length > 0)) && (
            <div className="grid gap-2">
              <Label htmlFor="locationFilter" className="pl-1">
                {locationType === "warehouse" ? "Almacén" : "Área de Venta"}
              </Label>
              <ComboboxPlus
                name="locationFilter"
                className="w-full min-w-0 sm:min-w-40"
                options={
                  locationType === "warehouse"
                    ? [
                        { value: "all", label: "Todos los almacenes" },
                        ...warehouses.map((wh) => ({
                          value: wh.id,
                          label: wh.name,
                        })),
                      ]
                    : [
                        { value: "all", label: "Todas las áreas" },
                        ...salesAreas.map((sa) => ({
                          value: sa.id,
                          label: sa.name,
                        })),
                      ]
                }
                value={locationFilter}
                onChange={(value) => setLocationFilter(value)}
                disable={false}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label className="pl-1">Tipo de Saldo</Label>
            <RadioGroup
              value={balanceType}
              onValueChange={setBalanceType}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="r2" value="salePrice" />
                <Label htmlFor="r2">Precio Venta</Label>
              </div>
              <div className="flex gap-2">
                <RadioGroupItem id="r1" value="costPrice" />
                <Label htmlFor="r1">Precio Costo</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label className="pl-1">Nombre de Categoría</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={showCategoryName}
                onCheckedChange={setShowCategoryName}
              />
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
                <TableHead className="font-semibold text-xs sm:text-sm">
                  ID Categoría
                </TableHead>
                {showCategoryName && (
                  <TableHead className="font-semibold text-xs sm:text-sm">
                    Categoría
                  </TableHead>
                )}
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Saldo Inicial
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Compras
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Traslados Recibidos
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Ventas
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Traslados Enviados
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Saldo Final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryBalanceByGeneralCategory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showCategoryName ? 8 : 7}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <BoxesIcon className="size-20 sm:size-32" />
                      <p className="font-semibold text-sm sm:text-base px-4">
                        No hay datos disponibles para el rango seleccionado.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                inventoryBalanceByGeneralCategory.map(
                  (generalCategory: any) => (
                    <>
                      <TableRow>
                        <TableCell
                          colSpan={showCategoryName ? 8 : 7}
                          className="text-center font-semibold"
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
                            {showCategoryName && (
                              <TableCell>{category.categoryName}</TableCell>
                            )}
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.saldoInicial,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.compras,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.trasladosRecibidos,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.ventas,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.trasladosEnviados,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                category.saldoFinal,
                                balanceType === "costPrice"
                                  ? "cost"
                                  : undefined,
                              )}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                      <TableRow className="font-semibold">
                        <TableCell colSpan={showCategoryName ? 2 : 1}>
                          SUBTOTAL
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalSaldoInicial,
                            balanceType === "costPrice" ? "cost" : undefined,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalCompras,
                            balanceType === "costPrice" ? "cost" : undefined,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalTrasladosRecibidos,
                            balanceType === "costPrice" ? "cost" : undefined,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalVentas,
                            balanceType === "costPrice" ? "cost" : undefined,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalTrasladosEnviados,
                            balanceType === "costPrice" ? "cost" : undefined,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            generalCategory.totalSaldoFinal,
                            balanceType === "costPrice" ? "cost" : undefined,
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
                <TableCell colSpan={showCategoryName ? 2 : 1}>TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.saldoInicial,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.compras,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.trasladosRecibidos,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.ventas,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.trasladosEnviados,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    grandTotals.saldoFinal,
                    balanceType === "costPrice" ? "cost" : undefined,
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
