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
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Label } from "~/components/ui/label";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { OutletContext } from "@/lib/types/types";
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

type SalesByProduct = {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  costAmount: number;
  saleAmount: number;
  stock: number;
};

type GroupedByCategory = {
  categoryId: string;
  categoryName: string;
  products: SalesByProduct[];
  totalQuantity: number;
  totalCostAmount: number;
  totalSaleAmount: number;
};

export default function SalesCategoryReport() {
  const { sales, salesAreas, products } = useOutletContext<OutletContext>();

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

  // Procesar datos: agrupar ventas por producto y fecha
  const salesByCategory = useMemo(() => {
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

      if (salesAreaId !== "all" && sale.salesAreaId !== salesAreaId) {
        return false;
      }

      return true;
    });

    // Agrupar ventas por producto (sin importar la fecha)
    const salesByProduct: Record<string, SalesByProduct> = {};

    filteredSales.forEach((sale) => {
      const key = sale.productId;

      if (!salesByProduct[key]) {
        // Encontrar el producto para obtener precio de costo
        const product = products.find((p) => p.id === sale.productId);

        // Calcular existencia total del producto en todas las áreas
        let totalStock = 0;
        salesAreas.forEach((area) => {
          const inventory = area.salesAreaInventories?.find(
            (inv) => inv.product.id === sale.productId
          );
          if (inventory) {
            totalStock += inventory.quantity;
          }
        });

        salesByProduct[key] = {
          productId: sale.productId,
          productName: sale.productName,
          categoryId: sale.categoryId,
          categoryName: sale.categoryName,
          quantity: 0,
          costPrice: product ? product.costPrice : 0,
          salePrice: product ? product.salePrice : 0,
          costAmount: 0,
          saleAmount: 0,
          stock: totalStock,
        };
      }

      salesByProduct[key].quantity += sale.quantity;
      salesByProduct[key].costAmount +=
        salesByProduct[key].costPrice * sale.quantity;
      salesByProduct[key].saleAmount += sale.saleAmount;
    });

    // Agrupar por categoría
    const groupedByCategory: Record<string, GroupedByCategory> = {};

    Object.values(salesByProduct).forEach((sale) => {
      if (!groupedByCategory[sale.categoryId]) {
        groupedByCategory[sale.categoryId] = {
          categoryId: sale.categoryId,
          categoryName: sale.categoryName,
          products: [],
          totalQuantity: 0,
          totalCostAmount: 0,
          totalSaleAmount: 0,
        };
      }

      groupedByCategory[sale.categoryId].products.push(sale);
      groupedByCategory[sale.categoryId].totalQuantity += sale.quantity;
      groupedByCategory[sale.categoryId].totalCostAmount += sale.costAmount;
      groupedByCategory[sale.categoryId].totalSaleAmount += sale.saleAmount;
    });

    // Ordenar productos dentro de cada categoría por nombre de producto
    Object.values(groupedByCategory).forEach((category) => {
      category.products.sort((a, b) => a.productName.localeCompare(b.productName));
    });

    // Convertir a array y ordenar por nombre de categoría
    return Object.values(groupedByCategory).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    );
  }, [sales, salesAreas, products, dateFrom, dateTo, salesAreaId]);

  // Calcular totales generales
  const grandTotals = useMemo(() => {
    return salesByCategory.reduce(
      (acc, category) => ({
        quantity: acc.quantity + category.totalQuantity,
        costAmount: acc.costAmount + category.totalCostAmount,
        saleAmount: acc.saleAmount + category.totalSaleAmount,
      }),
      { quantity: 0, costAmount: 0, saleAmount: 0 }
    );
  }, [salesByCategory]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setSalesAreaId("all");
  };

  const exportToExcel = () => {
    const data: any[] = [];

    salesByCategory.forEach((category) => {
      // Header de categoría
      data.push({
        "ID Producto": `---------- ${category.categoryId}: ${category.categoryName} ----------`,
        "Nombre Producto": "",
        Cantidad: "",
        "Precio Costo": "",
        "Importe al Costo": "",
        "Precio de Venta": "",
        "Importe a la Venta": "",
        Existencia: "",
      });

      // Productos de la categoría
      category.products.forEach((product) => {
        data.push({
          "ID Producto": product.productId,
          "Nombre Producto": product.productName,
          Cantidad: product.quantity,
          "Precio Costo": product.costPrice,
          "Importe al Costo": product.costAmount,
          "Precio de Venta": product.salePrice,
          "Importe a la Venta": product.saleAmount,
          Existencia: product.stock,
        });
      });

      // Subtotal de categoría
      data.push({
        "ID Producto": "SUBTOTAL",
        "Nombre Producto": "",
        Cantidad: category.totalQuantity,
        "Precio Costo": "",
        "Importe al Costo": category.totalCostAmount,
        "Precio de Venta": "",
        "Importe a la Venta": category.totalSaleAmount,
        Existencia: "",
      });

      // Línea en blanco
      data.push({});
    });

    // Total general
    data.push({
      "ID Producto": "TOTAL GENERAL",
      "Nombre Producto": "",
      Cantidad: grandTotals.quantity,
      "Precio Costo": "",
      "Importe al Costo": grandTotals.costAmount,
      "Precio de Venta": "",
      "Importe a la Venta": grandTotals.saleAmount,
      Existencia: "",
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ventas por Categoría");

    writeFile(
      wb,
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo
      )}_ventas_categoria.xlsx`
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Reporte de Ventas por Categoría", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${dateFrom} - ${dateTo}`, 14, 22);

    let startY = 28;

    salesByCategory.forEach((category, catIndex) => {
      // Verificar si hay espacio, si no, agregar nueva página
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }

      // Header de categoría
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${category.categoryId}: ${category.categoryName}`, 14, startY);
      startY += 7;

      // Tabla de productos
      const tableData = category.products.map((product) => [
        product.productId,
        product.productName,
        product.quantity.toString(),
        product.costPrice.toFixed(6),
        formatCurrency(product.costAmount),
        product.salePrice.toFixed(2),
        formatCurrency(product.saleAmount),
        product.stock.toString(),
      ]);

      autoTable(doc, {
        head: [
          [
            "ID",
            "Producto",
            "Cant.",
            "P. Costo",
            "Imp. Costo",
            "P. Venta",
            "Imp. Venta",
            "Exist.",
          ],
        ],
        body: tableData,
        foot: [
          [
            "SUBTOTAL",
            "",
            category.totalQuantity.toString(),
            "",
            formatCurrency(category.totalCostAmount),
            "",
            formatCurrency(category.totalSaleAmount),
            "",
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
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { halign: "right", cellWidth: 15 },
          3: { halign: "right", cellWidth: 20 },
          4: { halign: "right", cellWidth: 25 },
          5: { halign: "right", cellWidth: 20 },
          6: { halign: "right", cellWidth: 25 },
          7: { halign: "right", cellWidth: 15 },
        },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    // Total general
    if (startY > 260) {
      doc.addPage();
      startY = 15;
    }

    autoTable(doc, {
      body: [
        [
          "TOTAL GENERAL",
          "",
          grandTotals.quantity.toString(),
          "",
          formatCurrency(grandTotals.costAmount),
          "",
          formatCurrency(grandTotals.saleAmount),
          "",
        ],
      ],
      startY: startY,
      styles: { fontSize: 9, cellPadding: 2, fontStyle: "bold" },
      bodyStyles: {
        fillColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { halign: "right", cellWidth: 15 },
        3: { halign: "right", cellWidth: 20 },
        4: { halign: "right", cellWidth: 25 },
        5: { halign: "right", cellWidth: 20 },
        6: { halign: "right", cellWidth: 25 },
        7: { halign: "right", cellWidth: 15 },
      },
    });

    doc.save(
      `${formatDateForFilename(dateFrom)}_${formatDateForFilename(
        dateTo
      )}_ventas_categoria.pdf`
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
          <CardTitle>Ventas por Categoría</CardTitle>
          <CardAction className="grid grid-cols-2 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={salesByCategory.length === 0}
              variant="outline"
            >
              <IconFileTypeXls />
              Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={salesByCategory.length === 0}
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
                <TableHead className="font-semibold">ID Producto</TableHead>
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="text-right font-semibold">
                  Cantidad
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Precio Costo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe al Costo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Precio de Venta
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe a la Venta
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Existencia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesByCategory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                salesByCategory.map((category) => (
                  <>
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center font-semibold"
                      >
                        {category.categoryId}: {category.categoryName}
                      </TableCell>
                    </TableRow>
                    {category.products.map((product, index) => (
                      <TableRow
                        key={product.productId}
                        className={index % 2 === 0 ? "bg-secondary" : ""}
                      >
                        <TableCell>{product.productId}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right">
                          {product.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.costPrice, "cost")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.costAmount, "cost")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.salePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.saleAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.stock}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell colSpan={3}>SUBTOTAL</TableCell>
                      <TableCell colSpan={2} className="text-right">
                        {formatCurrency(category.totalCostAmount, "cost")}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right">
                        {formatCurrency(category.totalSaleAmount)}
                      </TableCell>
                    </TableRow>
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
