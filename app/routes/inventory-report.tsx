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
import type { OutletContext } from "@/lib/types/types";
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
  locationId: string;
  locationName: string;
  locationType: "warehouse" | "salesArea";
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  costAmount: number;
  saleAmount: number;
  unit: string;
  isLowStock: boolean;
};

const locations = [
  { value: "all", label: "Todas" },
  { value: "warehouse", label: "Almacén" },
  { value: "salesArea", label: "Área de Venta" },
];

export default function InventoryReport() {
  const { warehouses, salesAreas, products, categories } =
    useOutletContext<OutletContext>();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
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

  // Procesar inventario combinado
  const inventoryData = useMemo(() => {
    const inventory: InventoryItem[] = [];

    // Inventario de almacenes
    warehouses.forEach((warehouse) => {
      if (selectedLocation === "all" || selectedLocation === "warehouse") {
        if (
          selectedLocationId === "all" ||
          warehouse.id === selectedLocationId
        ) {
          warehouse.warehouseInventories?.forEach((inv) => {
            const product = products.find((p) => p.id === inv.productId);
            if (!product) return;

            const category = categories.find(
              (c) => c.id === product.categoryId,
            );
            const costPrice = Number(product.costPrice);
            const salePrice = Number(product.salePrice);
            const quantity = inv.quantity;

            inventory.push({
              locationId: warehouse.id,
              locationName: warehouse.name,
              locationType: "warehouse",
              productId: product.id,
              productName: product.name,
              categoryId: product.categoryId,
              categoryName: category?.name || "Sin categoría",
              quantity: quantity,
              minStock: inv.minStock || 0,
              costPrice: costPrice,
              salePrice: salePrice,
              costAmount: costPrice * quantity,
              saleAmount: salePrice * quantity,
              unit: product.unit,
              isLowStock: quantity <= (inv.minStock || 0),
            });
          });
        }
      }
    });

    // Inventario de áreas de ventas
    salesAreas.forEach((salesArea) => {
      if (selectedLocation === "all" || selectedLocation === "salesArea") {
        if (
          selectedLocationId === "all" ||
          salesArea.id === selectedLocationId
        ) {
          salesArea.salesAreaInventories?.forEach((inv) => {
            const product = products.find((p) => p.id === inv.productId);
            if (!product) return;

            const category = categories.find(
              (c) => c.id === product.categoryId,
            );
            const costPrice = Number(product.costPrice);
            const salePrice = Number(product.salePrice);
            const quantity = inv.quantity;

            inventory.push({
              locationId: salesArea.id,
              locationName: salesArea.name,
              locationType: "salesArea",
              productId: product.id,
              productName: product.name,
              categoryId: product.categoryId,
              categoryName: category?.name || "Sin categoría",
              quantity: quantity,
              minStock: inv.minStock || 0,
              costPrice: costPrice,
              salePrice: salePrice,
              costAmount: costPrice * quantity,
              saleAmount: salePrice * quantity,
              unit: product.unit,
              isLowStock: quantity <= (inv.minStock || 0),
            });
          });
        }
      }
    });

    return inventory;
  }, [
    warehouses,
    salesAreas,
    products,
    categories,
    selectedLocation,
    selectedLocationId,
  ]);

  // Filtrar inventario
  const filteredInventory = useMemo(() => {
    let filtered = inventoryData;

    // Filtrar por categoría
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(
        (item) => item.categoryId === selectedCategoryId,
      );
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(search) ||
          item.productId.toLowerCase().includes(search),
      );
    }

    // Ordenar por ubicación y luego por nombre de producto
    return filtered.sort((a, b) => {
      if (a.locationType !== b.locationType) {
        return a.locationType.localeCompare(b.locationType);
      }
      if (a.locationName !== b.locationName) {
        return a.locationName.localeCompare(b.locationName);
      }
      return a.productName.localeCompare(b.productName);
    });
  }, [inventoryData, selectedCategoryId, searchTerm]);

  // Calcular totales
  const totals = useMemo(() => {
    return filteredInventory.reduce(
      (sum, item) => ({
        totalCostAmount: sum.totalCostAmount + item.costAmount,
        totalSaleAmount: sum.totalSaleAmount + item.saleAmount,
        quantity: sum.quantity + item.quantity,
        costValue: sum.costValue + item.costAmount,
        saleValue: sum.saleValue + item.saleAmount,
      }),
      { 
        totalCostAmount: 0, 
        totalSaleAmount: 0,
        quantity: 0,
        costValue: 0,
        saleValue: 0,
      },
    );
  }, [filteredInventory]);

  // Productos con stock bajo
  const lowStockItems = useMemo(() => {
    return filteredInventory.filter((item) => item.isLowStock);
  }, [filteredInventory]);

  const clearFilters = () => {
    setSelectedLocationId("all");
    setSelectedLocation("all");
    setSelectedCategoryId("all");
    setSearchTerm("");
  };

  const exportToExcel = () => {
    const data = filteredInventory.map((item) => ({
      Ubicación: item.locationName,
      Tipo: item.locationType === "warehouse" ? "Almacén" : "Área de Venta",
      "ID Producto": item.productId,
      Producto: item.productName,
      Categoría: item.categoryName,
      Cantidad: item.quantity,
      Unidad: item.unit,
      "Stock Mínimo": item.minStock,
      "Precio Costo": item.costPrice,
      "Valor al Costo": item.costAmount,
      "Precio Venta": item.salePrice,
      "Valor a la Venta": item.saleAmount,
      Estado: item.isLowStock ? "STOCK BAJO" : "OK",
    }));

    // Agregar fila de totales
    data.push({
      Ubicación: "TOTALES",
      Tipo: "",
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
      // Columnas I, J, K, L (Precio Costo, Valor al Costo, Precio Venta, Valor a la Venta)
      for (let C = 8; C <= 11; C++) {
        const cellAddress = utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && typeof ws[cellAddress].v === "number") {
          ws[cellAddress].z = "$#,##0.00";
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];
    writeFile(wb, `${today}_inventario_tienda.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Inventario de la Tienda", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CU")}`, 14, 22);

    if (selectedLocation !== "all" && selectedLocationId !== "all") {
      const location =
        selectedLocation === "warehouse"
          ? warehouses.find((w) => w.id === selectedLocationId)
          : salesAreas.find((sa) => sa.id === selectedLocationId);
      if (location) {
        const locationTypeText =
          selectedLocation === "warehouse" ? "Almacén" : "Área de Venta";
        doc.text(`${locationTypeText}: ${location.name}`, 14, 28);
      }
    }

    const tableData = filteredInventory.map((item) => [
      item.locationName,
      item.locationType === "warehouse" ? "Almacén" : "Área Venta",
      item.productId,
      item.productName,
      item.categoryName,
      item.quantity.toString(),
      item.unit,
      item.minStock.toString(),
      item.costPrice.toFixed(6),
      formatCurrency(item.costAmount),
      item.salePrice.toFixed(2),
      formatCurrency(item.saleAmount),
      item.isLowStock ? "⚠" : "✓",
    ]);

    autoTable(doc, {
      head: [
        [
          "Ubicación",
          "Tipo",
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
      startY:
        selectedLocation !== "all" && selectedLocationId !== "all" ? 32 : 26,
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
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 40 },
        4: { cellWidth: 22 },
        5: { halign: "right", cellWidth: 10 },
        6: { cellWidth: 12 },
        7: { halign: "right", cellWidth: 8 },
        8: { halign: "right", cellWidth: 16 },
        9: { halign: "right", cellWidth: 18 },
        10: { halign: "right", cellWidth: 16 },
        11: { halign: "right", cellWidth: 18 },
        12: { halign: "center", cellWidth: 8 },
      },
    });

    const today = new Date().toISOString().split("T")[0];
    doc.save(`${today}_inventario_tienda.pdf`);
  };

  // Obtener opciones de ubicación según el tipo seleccionado
  const getLocationOptions = () => {
    if (selectedLocation === "warehouse") {
      return [
        { value: "all", label: "Todos los almacenes" },
        ...warehouses.map((w) => ({
          value: w.id,
          label: w.name,
        })),
      ];
    } else if (selectedLocation === "salesArea") {
      return [
        { value: "all", label: "Todas las áreas" },
        ...salesAreas.map((sa) => ({
          value: sa.id,
          label: sa.name,
        })),
      ];
    }
    return [{ value: "all", label: "Toda la tienda" }];
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
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="location" className="pl-1">
              Ubicación
            </Label>
            <ComboboxPlus
              name="location"
              className="w-full min-w-40"
              options={locations}
              value={selectedLocation}
              onChange={(value) => {
                setSelectedLocation(value);
                setSelectedLocationId("all");
              }}
            />
          </div>
          {selectedLocation !== "all" && (
            <div className="grid gap-2">
              <Label htmlFor="locationId" className="pl-1">
                {selectedLocation === "warehouse" ? "Almacén" : "Área de Venta"}
              </Label>
              <ComboboxPlus
                name="locationId"
                className="w-full min-w-40"
                options={getLocationOptions()}
                value={selectedLocationId}
                onChange={(value) => setSelectedLocationId(value)}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="categoryId" className="pl-1">
              Categoría
            </Label>
            <ComboboxPlus
              name="categoryId"
              className="w-full min-w-40"
              options={[
                { value: "all", label: "Todas" },
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
              placeholder="ID o Nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            Inventario
            {selectedLocation === "store" && " de la Tienda"}
            {selectedLocation === "warehouse" &&
              selectedLocationId !== "all" &&
              ` - ${warehouses.find((w) => w.id === selectedLocationId)?.name}`}
            {selectedLocation === "salesArea" &&
              selectedLocationId !== "all" &&
              ` - ${salesAreas.find((sa) => sa.id === selectedLocationId)?.name}`}
          </CardTitle>
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
                    <TableHead className="font-semibold">Ubicación</TableHead>
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
                    <TableHead className="text-right font-semibold">
                      Imp. Costo
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Imp. Venta
                    </TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item, index) => (
                    <TableRow
                      key={`${item.locationId}_${item.productId}`}
                      className={`${index % 2 === 0 ? "bg-secondary" : ""} ${
                        item.isLowStock ? "bg-orange-50" : ""
                      }`}
                    >
                      <TableCell>
                        <div>{item.locationName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.locationType === "warehouse"
                            ? "Almacén"
                            : "Área Venta"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.productId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.categoryName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.categoryId}
                        </div>
                      </TableCell>
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
                      <TableCell className="text-right">
                        {formatCurrency(item.costAmount, "cost")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.saleAmount)}
                      </TableCell>
                      <TableCell>
                        {item.isLowStock ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs">Bajo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="h-2 w-2 rounded-full bg-green-600" />
                            <span className="text-xs">OK</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold bg-secondary">
                    <TableCell colSpan={6} className="text-right">
                      TOTAL:
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totals.totalCostAmount, "cost")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totals.totalSaleAmount)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
