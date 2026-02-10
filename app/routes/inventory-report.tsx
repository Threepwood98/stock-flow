import { useState, useMemo } from "react";
import { useLoaderData } from "react-router";
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
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/inventory-report";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;
  const userStores = await prisma.userStore.findMany({
    where: { userId: user.id },
    select: { storeId: true },
  });

  const storeIds = userStores.map((us) => us.storeId);

  const [
    warehouseInventories,
    salesAreaInventories,
    categories,
    warehouses,
    salesAreas,
  ] = await Promise.all([
    prisma.warehouseInventory.findMany({
      where: { warehouse: { storeId: { in: storeIds } } },
      include: { warehouse: true, product: { include: { category: true } } },
      orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
    }),
    prisma.salesAreaInventory.findMany({
      where: { salesArea: { storeId: { in: storeIds } } },
      include: { salesArea: true, product: { include: { category: true } } },
      orderBy: [{ salesArea: { name: "asc" } }, { product: { name: "asc" } }],
    }),
    prisma.category.findMany({
      include: { generalCategory: true },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { name: "asc" },
    }),
    prisma.salesArea.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { name: "asc" },
    }),
  ]);

  const warehouseData = warehouseInventories.map((inv) => {
    const quantity = inv.quantity.toNumber();
    const costPrice = inv.product.costPrice.toNumber();
    const salePrice = inv.product.salePrice.toNumber();
    const minStock = inv.minStock?.toNumber() || 0;

    return {
      locationId: inv.warehouse.id,
      locationName: inv.warehouse.name,
      locationType: "warehouse" as const,
      productId: inv.product.id,
      productName: inv.product.name,
      categoryId: inv.product.category.id,
      categoryName: inv.product.category.name,
      quantity,
      minStock,
      costPrice,
      salePrice,
      costAmount: costPrice * quantity,
      saleAmount: salePrice * quantity,
      unit: inv.product.unit,
      isLowStock: quantity <= minStock,
    };
  });

  const salesAreaData = salesAreaInventories.map((inv) => {
    const quantity = inv.quantity.toNumber();
    const costPrice = inv.product.costPrice.toNumber();
    const salePrice = inv.product.salePrice.toNumber();
    const minStock = inv.minStock?.toNumber() || 0;

    return {
      locationId: inv.salesArea.id,
      locationName: inv.salesArea.name,
      locationType: "salesArea" as const,
      productId: inv.product.id,
      productName: inv.product.name,
      categoryId: inv.product.category.id,
      categoryName: inv.product.category.name,
      quantity,
      minStock,
      costPrice,
      salePrice,
      costAmount: costPrice * quantity,
      saleAmount: salePrice * quantity,
      unit: inv.product.unit,
      isLowStock: quantity <= minStock,
    };
  });

  const inventoryData = [...warehouseData, ...salesAreaData].sort((a, b) => {
    if (a.locationType !== b.locationType) {
      return a.locationType.localeCompare(b.locationType);
    }
    if (a.locationName !== b.locationName) {
      return a.locationName.localeCompare(b.locationName);
    }
    return a.productName.localeCompare(b.productName);
  });

  return {
    inventoryData,
    categories,
    warehouses,
    salesAreas,
  };
}

const locations = [
  { value: "all", label: "Todas" },
  { value: "warehouse", label: "Almacén" },
  { value: "salesArea", label: "Área de Venta" },
];

export default function InventoryReport() {
  const { inventoryData, categories, warehouses, salesAreas } =
    useLoaderData<typeof loader>();
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

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item: any) => {
      // Filtrar por ubicación
      if (selectedLocation !== "all") {
        if (item.locationType !== selectedLocation) {
          return false;
        }
        if (
          selectedLocationId !== "all" &&
          item.locationId !== selectedLocationId
        ) {
          return false;
        }
      }

      // Filtrar por categoría si está seleccionada
      if (
        selectedCategoryId !== "all" &&
        item.categoryId !== selectedCategoryId
      ) {
        return false;
      }

      // Filtrar por término de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !item.productName.toLowerCase().includes(search) &&
          !item.productId.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    inventoryData,
    selectedLocation,
    selectedLocationId,
    selectedCategoryId,
    searchTerm,
  ]);

  const totals = useMemo(() => {
    return filteredInventory.reduce(
      (sum, item) => ({
        costAmount: sum.costAmount + item.costAmount,
        saleAmount: sum.saleAmount + item.saleAmount,
      }),
      { costAmount: 0, saleAmount: 0 },
    );
  }, [filteredInventory]);

  const clearFilters = () => {
    setSelectedLocationId("all");
    setSelectedLocation("all");
    setSelectedCategoryId("all");
    setSearchTerm("");
  };

  const exportToExcel = () => {
    // Reutilizar filteredInventory en lugar de duplicar el filtro
    const exportData = filteredInventory.map((item: any) => ({
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

    // Calcular totales del filtro
    const filteredTotals = filteredInventory.reduce(
      (sum: any, item: any) => ({
        quantity: sum.quantity + item.quantity,
        costValue: sum.costValue + item.costAmount,
        saleValue: sum.saleValue + item.saleAmount,
      }),
      { quantity: 0, costValue: 0, saleValue: 0 },
    );

    // Agregar fila de totales
    exportData.push({
      Ubicación: "TOTALES",
      Tipo: "",
      "ID Producto": "",
      Producto: "",
      Categoría: "",
      Cantidad: filteredTotals.quantity,
      Unidad: "",
      "Stock Mínimo": 0,
      "Precio Costo": 0,
      "Valor al Costo": filteredTotals.costValue,
      "Precio Venta": 0,
      "Valor a la Venta": filteredTotals.saleValue,
      Estado: "",
    });

    const ws = utils.json_to_sheet(exportData);
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

    // Reutilizar filteredInventory que ya incluye todos los filtros
    const tableData = filteredInventory.map((item: any) => [
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
          filteredInventory
            .reduce((sum: number, item: any) => sum + item.quantity, 0)
            .toString(),
          "",
          "",
          "",
          formatCurrency(
            filteredInventory.reduce(
              (sum: number, item: any) => sum + item.costAmount,
              0,
            ),
          ),
          "",
          formatCurrency(
            filteredInventory.reduce(
              (sum: number, item: any) => sum + item.saleAmount,
              0,
            ),
          ),
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
    <div className="flex h-dvh -mt-12 flex-col pt-16 pb-4 px-4 gap-2">
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Filtros</CardTitle>
          <CardAction>
            <Button onClick={clearFilters} variant="outline">
              Limpiar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0 grid gap-2 md:grid-cols-4">
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
      <Card className="flex flex-1 min-h-0 p-4">
        <CardHeader className="p-0">
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
          <CardAction className="grid grid-cols-2 gap-2">
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
        <CardContent className="p-0 flex overflow-auto min-h-0">
          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 p-6">
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
                <TableRow className="bg-secondary">
                  {selectedLocation === "all" ||
                  selectedLocationId === "all" ? (
                    <TableHead className="font-semibold">Ubicación</TableHead>
                  ) : null}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item: any, index: number) => (
                  <TableRow
                    key={`${item.locationId}_${item.productId}`}
                    className={`${item.isLowStock ? "bg-red-50" : ""}`}
                  >
                    {selectedLocation === "all" ||
                    selectedLocationId === "all" ? (
                      <TableCell>
                        <div>{item.locationName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.locationType === "warehouse"
                            ? "Almacén"
                            : "Área Venta"}
                        </div>
                      </TableCell>
                    ) : null}
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
                        item.isLowStock ? "text-red-600" : ""
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
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="font-semibold bg-secondary">
                  <TableCell
                    colSpan={
                      selectedLocation === "all" || selectedLocationId === "all"
                        ? 6
                        : 5
                    }
                    className="text-right"
                  >
                    TOTAL:
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.costAmount, "cost")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.saleAmount)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
