import { useState, useMemo } from "react";
import { useOutletContext } from "react-router";
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
import type { OutletContext } from "@/types/types";
import { PackageIcon, AlertTriangle } from "lucide-react";
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
import { Input } from "~/components/ui/input";

type InventoryItem = {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  totalCostValue: number;
  totalSaleValue: number;
  unit: string;
  isLowStock: boolean;
};

export default function WarehouseInventory() {
  const { warehouses, products, categories } =
    useOutletContext<OutletContext>();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const formatCurrency = (value: number, type?: string) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: type === "cost" ? 6 : 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Procesar inventario
  const inventoryData = useMemo(() => {
    const inventory: InventoryItem[] = [];

    warehouses.forEach((warehouse) => {
      warehouse.warehouseInventories?.forEach((inv) => {
        const product = products.find((p) => p.id === inv.productId);
        if (!product) return;

        const category = categories.find((c) => c.id === product.categoryId);
        const costPrice = Number(product.costPrice);
        const salePrice = Number(product.salePrice);
        const quantity = inv.quantity;

        inventory.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          productId: product.id,
          productName: product.name,
          categoryId: product.categoryId,
          categoryName: category?.name || "Sin categoría",
          quantity: quantity,
          minStock: inv.minStock || 0,
          costPrice: costPrice,
          salePrice: salePrice,
          totalCostValue: costPrice * quantity,
          totalSaleValue: salePrice * quantity,
          unit: product.unit,
          isLowStock: quantity <= (inv.minStock || 0),
        });
      });
    });

    return inventory;
  }, [warehouses, products, categories]);

  // Filtrar inventario
  const filteredInventory = useMemo(() => {
    let filtered = inventoryData;

    // Filtrar por almacén
    if (selectedWarehouseId !== "all") {
      filtered = filtered.filter(
        (item) => item.warehouseId === selectedWarehouseId
      );
    }

    // Filtrar por categoría
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(
        (item) => item.categoryId === selectedCategoryId
      );
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(search) ||
          item.productId.toLowerCase().includes(search)
      );
    }

    // Ordenar por almacén y luego por nombre de producto
    return filtered.sort((a, b) => {
      if (a.warehouseName !== b.warehouseName) {
        return a.warehouseName.localeCompare(b.warehouseName);
      }
      return a.productName.localeCompare(b.productName);
    });
  }, [inventoryData, selectedWarehouseId, selectedCategoryId, searchTerm]);

  // Calcular totales
  const totals = useMemo(() => {
    return filteredInventory.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantity,
        costValue: acc.costValue + item.totalCostValue,
        saleValue: acc.saleValue + item.totalSaleValue,
      }),
      { quantity: 0, costValue: 0, saleValue: 0 }
    );
  }, [filteredInventory]);

  // Productos con stock bajo
  const lowStockItems = useMemo(() => {
    return filteredInventory.filter((item) => item.isLowStock);
  }, [filteredInventory]);

  const clearFilters = () => {
    setSelectedWarehouseId("all");
    setSelectedCategoryId("all");
    setSearchTerm("");
  };

  const exportToExcel = () => {
    const data = filteredInventory.map((item) => ({
      Almacén: item.warehouseName,
      "ID Producto": item.productId,
      Producto: item.productName,
      Categoría: item.categoryName,
      Cantidad: item.quantity,
      Unidad: item.unit,
      "Stock Mínimo": item.minStock,
      "Precio Costo": item.costPrice,
      "Valor al Costo": item.totalCostValue,
      "Precio Venta": item.salePrice,
      "Valor a la Venta": item.totalSaleValue,
      Estado: item.isLowStock ? "STOCK BAJO" : "OK",
    }));

    // Agregar fila de totales
    data.push({
      Almacén: "TOTALES",
      "ID Producto": "",
      Producto: "",
      Categoría: "",
      Cantidad: totals.quantity,
      Unidad: "",
      "Stock Mínimo": 0,
      "Precio Costo": 0,
      "Valor al Costo": totals.costValue,
      "Precio Venta": 0,
      "Valor a la Venta": totals.saleValue,
      Estado: "",
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Inventario");

    // Aplicar formato de moneda
    const range = utils.decode_range(ws["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      // Columnas H, I, J, K (Precio Costo, Valor al Costo, Precio Venta, Valor a la Venta)
      for (let C = 7; C <= 10; C++) {
        const cellAddress = utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
          ws[cellAddress].z = "$#,##0.00";
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];
    writeFile(wb, `${today}_inventario_almacenes.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Inventario de Almacenes", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CU")}`, 14, 22);

    if (selectedWarehouseId !== "all") {
      const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);
      if (warehouse) {
        doc.text(`Almacén: ${warehouse.name}`, 14, 28);
      }
    }

    const tableData = filteredInventory.map((item) => [
      item.warehouseName,
      item.productId,
      item.productName,
      item.categoryName,
      item.quantity.toString(),
      item.unit,
      item.minStock.toString(),
      item.costPrice.toFixed(6),
      formatCurrency(item.totalCostValue),
      item.salePrice.toFixed(2),
      formatCurrency(item.totalSaleValue),
      item.isLowStock ? "⚠" : "✓",
    ]);

    autoTable(doc, {
      head: [
        [
          "Almacén",
          "ID",
          "Producto",
          "Categoría",
          "Cant.",
          "Unidad",
          "Min",
          "P. Costo",
          "Val. Costo",
          "P. Venta",
          "Val. Venta",
          "Est.",
        ],
      ],
      body: tableData,
      foot: [
        [
          "TOTALES",
          "",
          "",
          "",
          totals.quantity.toString(),
          "",
          "",
          "",
          formatCurrency(totals.costValue),
          "",
          formatCurrency(totals.saleValue),
          "",
        ],
      ],
      startY: selectedWarehouseId !== "all" ? 32 : 26,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [68, 114, 196],
        fontStyle: "bold",
        halign: "center",
        fontSize: 7,
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { halign: "right", cellWidth: 12 },
        5: { cellWidth: 15 },
        6: { halign: "right", cellWidth: 10 },
        7: { halign: "right", cellWidth: 18 },
        8: { halign: "right", cellWidth: 22 },
        9: { halign: "right", cellWidth: 18 },
        10: { halign: "right", cellWidth: 22 },
        11: { halign: "center", cellWidth: 10 },
      },
    });

    const today = new Date().toISOString().split("T")[0];
    doc.save(`${today}_inventario_almacenes.pdf`);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Alerta de stock bajo */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-semibold text-orange-900">
                {lowStockItems.length} producto(s) con stock bajo o agotado
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardAction>
            <Button onClick={clearFilters} variant="outline">
              Limpiar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="warehouseId" className="pl-1">
              Almacén
            </Label>
            <ComboboxPlus
              name="warehouseId"
              className="w-full min-w-40"
              options={[
                { value: "all", label: "Todos los almacenes" },
                ...warehouses.map((w) => ({
                  value: w.id,
                  label: w.name,
                })),
              ]}
              value={selectedWarehouseId}
              onChange={(value) => setSelectedWarehouseId(value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="categoryId" className="pl-1">
              Categoría
            </Label>
            <ComboboxPlus
              name="categoryId"
              className="w-full min-w-40"
              options={[
                { value: "all", label: "Todas las categorías" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.generalCategoryId})`,
                })),
              ]}
              value={selectedCategoryId}
              onChange={(value) => setSelectedCategoryId(value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="search" className="pl-1">
              Buscar Producto
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Nombre o ID del producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardAction className="grid grid-cols-2 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={filteredInventory.length === 0}
              variant="outline"
            >
              <IconFileTypeXls className="mr-2" />
              Excel
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={filteredInventory.length === 0}
              variant="outline"
            >
              <IconFileTypePdf className="mr-2" />
              PDF
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <PackageIcon className="size-32 text-gray-300" />
                <p className="font-semibold text-gray-600">
                  No hay productos en inventario para los filtros seleccionados.
                </p>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Almacén</TableHead>
                    <TableHead className="font-semibold">Producto</TableHead>
                    <TableHead className="font-semibold">Categoría</TableHead>
                    <TableHead className="text-right font-semibold">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Precio Costo
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Precio Venta
                    </TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item, index) => (
                    <TableRow
                      key={`${item.warehouseId}_${item.productId}`}
                      className={`${index % 2 === 0 ? "bg-secondary" : ""} ${
                        item.isLowStock ? "bg-orange-50" : ""
                      }`}
                    >
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell
                        className={`text-right ${
                          item.isLowStock ? "text-orange-600" : ""
                        }`}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.costPrice, "cost")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.salePrice)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
