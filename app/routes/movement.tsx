import { useState, type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import {
  redirect,
  useFetcher,
  useOutletContext,
  useSearchParams,
} from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { format, parse, isValid } from "date-fns";
import { DatePickerPlus } from "~/components/date-picker-plus";
import { SelectList } from "~/components/select-list";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/inflow";
import { prisma } from "@/lib/prisma";
import {
  BanIcon,
  CalculatorIcon,
  EraserIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  WarehouseIcon,
} from "lucide-react";
import type { OutletContext, Product } from "@/lib/types/types";

interface ProductWithStock extends Product {
  stock?: number;
}
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Decimal } from "@prisma/client/runtime/client";
import { InputGroup } from "~/components/ui/input-group";
import { Toggle } from "~/components/ui/toggle";
import { LockIcon, LockOpenIcon } from "lucide-react";

interface MovementRow {
  userId: string;
  sourceSalesAreaId: string;
  sourceSalesAreaName: string;
  date: string;
  movementType: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationSalesAreaId: string;
  destinationSalesAreaName: string;
  movementNumber: string;
  productId: string;
  productName: string;
  quantity: string;
  saleAmount: number;
  costAmount: number;
}

const movementTypeOptions = [
  { value: "DEVOLUCION", label: "DEVOLUCION" },
  { value: "TRASLADO", label: "TRASLADO" },
];

const initialFormValues: MovementRow = {
  userId: "",
  sourceSalesAreaId: "",
  sourceSalesAreaName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  movementType: "",
  destinationWarehouseId: "",
  destinationWarehouseName: "",
  destinationSalesAreaId: "",
  destinationSalesAreaName: "",
  movementNumber: "",
  productId: "",
  productName: "",
  quantity: "",
  saleAmount: 0,
  costAmount: 0,
};

// Server Action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawRows = formData.get("rows");

  if (!rawRows) {
    return new Response(
      JSON.stringify({ error: "No hay datos para insertar." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let rows: MovementRow[];
  try {
    rows = JSON.parse(rawRows as string);
  } catch {
    return new Response(
      JSON.stringify({ error: "Formato inválido de datos." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: "No hay filas para insertar." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const data = rows.map((row) => {
      const parsedDate = parse(row.date, "dd/MM/yyyy", new Date());

      if (!isValid(parsedDate)) {
        throw new Error(`Fecha inválida: ${row.date}`);
      }

      const quantity = parseInt(row.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Cantidad inválida: ${row.quantity}`);
      }

      const isDEVOLUCION = row.movementType === "DEVOLUCION";

      return {
        userId: row.userId,
        movementType: row.movementType,
        date: parsedDate,
        sourceSalesAreaId: row.sourceSalesAreaId,
        destinationWarehouseId: isDEVOLUCION
          ? row.destinationWarehouseId
          : null,
        destinationSalesAreaId: !isDEVOLUCION
          ? row.destinationSalesAreaId
          : null,
        movementNumber: row.movementNumber,
        productId: row.productId,
        quantity,
        costAmount: new Decimal(row.costAmount ?? 0),
        saleAmount: new Decimal(row.saleAmount ?? 0),
      };
    });

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        data.map(async (entry) => {
          await tx.movement.create({ data: entry });

          // Reduce inventory in source sales area
          const sourceInventory = await tx.salesAreaInventory.findUnique({
            where: {
              salesAreaId_productId: {
                salesAreaId: entry.sourceSalesAreaId,
                productId: entry.productId,
              },
            },
          });

          if (!sourceInventory) {
            throw new Error(
              `No existe inventario en el área de venta origen para el producto ${entry.productId}`,
            );
          }

          if (sourceInventory.quantity < entry.quantity) {
            throw new Error(
              `Inventario insuficiente en el área de venta origen. Disponible: ${sourceInventory.quantity}, Requerido: ${entry.quantity}`,
            );
          }

          await tx.salesAreaInventory.update({
            where: { id: sourceInventory.id },
            data: { quantity: { decrement: entry.quantity } },
          });

          // Increase inventory in destination
          if (entry.destinationWarehouseId) {
            // DEVOLUCION: Add to warehouse inventory and create inflow record
            const destInventory = await tx.warehouseInventory.findUnique({
              where: {
                warehouseId_productId: {
                  warehouseId: entry.destinationWarehouseId,
                  productId: entry.productId,
                },
              },
            });

            if (destInventory) {
              await tx.warehouseInventory.update({
                where: { id: destInventory.id },
                data: { quantity: { increment: entry.quantity } },
              });
            } else {
              await tx.warehouseInventory.create({
                data: {
                  warehouseId: entry.destinationWarehouseId,
                  productId: entry.productId,
                  quantity: entry.quantity,
                  minStock: 0,
                },
              });
            }

            // Create inflow record for DEVOLUCION
            await tx.inflow.create({
              data: {
                userId: entry.userId,
                warehouseId: entry.destinationWarehouseId,
                date: entry.date,
                inType: "DEVOLUCION",
                providerCompanyId: null,
                providerStoreId: null,
                payMethod: null,
                invoiceNumber: null,
                inNumber: entry.movementNumber,
                productId: entry.productId,
                quantity: entry.quantity,
                costAmount: entry.costAmount,
                saleAmount: entry.saleAmount,
              },
            });
          } else if (entry.destinationSalesAreaId) {
            // TRASLADO: Add to destination sales area inventory
            const destInventory = await tx.salesAreaInventory.findUnique({
              where: {
                salesAreaId_productId: {
                  salesAreaId: entry.destinationSalesAreaId,
                  productId: entry.productId,
                },
              },
            });

            if (destInventory) {
              await tx.salesAreaInventory.update({
                where: { id: destInventory.id },
                data: { quantity: { increment: entry.quantity } },
              });
            } else {
              await tx.salesAreaInventory.create({
                data: {
                  salesAreaId: entry.destinationSalesAreaId,
                  productId: entry.productId,
                  quantity: entry.quantity,
                  minStock: 0,
                },
              });
            }
          }
        }),
      );
    });

    return redirect("/main/sale-area/movement?success=1");
  } catch (error: any) {
    console.error("❌ Error al insertar:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error al guardar en la base de datos.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// Component
export default function Movement() {
  const {
    user,
    warehouses,
    products: initialProducts,
    salesAreas,
  } = useOutletContext<OutletContext>();

  // Get initial available products based on first sales area
  const getInitialAvailableProducts = () => {
    const firstSalesArea = salesAreas[0];
    if (firstSalesArea && firstSalesArea.salesAreaInventories) {
      return firstSalesArea.salesAreaInventories.map((inv) => ({
        ...inv.product,
        stock: inv.quantity,
      }));
    }
    return initialProducts;
  };

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<MovementRow>({
    ...initialFormValues,
    userId: user.id,
    sourceSalesAreaId: salesAreas[0]?.id || "",
    sourceSalesAreaName: salesAreas[0]?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [products, setProducts] = useState<ProductWithStock[]>(
    getInitialAvailableProducts(),
  );
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [isInTypeLocked, setIsInTypeLocked] = useState(false);
  const [isProductLocked, setIsProductLocked] = useState(false);
  const [isSourceAreaLocked, setIsSourceAreaLocked] = useState(false);
  const [isDestAreaLocked, setIsDestAreaLocked] = useState(false);
  const [isMovementNumberLocked, setIsMovementNumberLocked] = useState(false);

  const fetcher = useFetcher();

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Movimientos contabilizados exitosamente.");
      setRows([]);
    }
  }, [searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editIndex !== null) {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editIndex]);

  const handleChange = (name: keyof MovementRow, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Update available products when source sales area changes
    if (name === "sourceSalesAreaId") {
      const salesArea = salesAreas.find((sa) => sa.id === value);
      if (salesArea && salesArea.salesAreaInventories) {
        const availableProducts: ProductWithStock[] =
          salesArea.salesAreaInventories.map((inv) => ({
            ...inv.product,
            stock: inv.quantity,
          }));
        setProducts(availableProducts);

        // Reset product selection if current product is not in new inventory
        const currentProductAvailable = availableProducts.some(
          (p) => p.id === formValues.productId,
        );
        if (!currentProductAvailable) {
          setFormValues((prev) => ({
            ...prev,
            productId: "",
            productName: "",
          }));
        }
      } else {
        setProducts(initialProducts);
      }
    }
  };

  const calculateAmount = (
    productId: string,
    quantity: string,
  ): { costAmount: number; saleAmount: number } => {
    const product = products.find((p) => p.id === productId);
    const qty = parseInt(quantity, 10);

    if (!product || isNaN(qty) || qty <= 0) {
      return { costAmount: 0, saleAmount: 0 };
    }

    const costPrice = product.costPrice;
    const salePrice = product.salePrice;
    return { costAmount: qty * costPrice, saleAmount: qty * salePrice };
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = parseInt(formValues.quantity, 10);

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    if (!formValues.sourceSalesAreaId) {
      toast.error("Debe seleccionar un área de venta origen.");
      return;
    }

    if (
      formValues.movementType === "DEVOLUCION" &&
      !formValues.destinationWarehouseId
    ) {
      toast.error("Debe seleccionar un almacén destino para la devolución.");
      return;
    }

    if (
      formValues.movementType === "TRASLADO" &&
      !formValues.destinationSalesAreaId
    ) {
      toast.error(
        "Debe seleccionar un área de venta destino para el traslado.",
      );
      return;
    }

    const amount = calculateAmount(formValues.productId, formValues.quantity);

    const rowWithAmount: MovementRow = {
      ...formValues,
      costAmount: amount.costAmount,
      saleAmount: amount.saleAmount,
    };

    if (editIndex !== null) {
      setRows((prev) =>
        prev.map((row, i) => (i === editIndex ? rowWithAmount : row)),
      );
      toast.success("Fila actualizada correctamente.");
    } else {
      setRows((prev) => [...prev, rowWithAmount]);
      toast.success("Fila agregada correctamente.");
    }

    handleCancel();
  };

  const handleClean = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      sourceSalesAreaId: isSourceAreaLocked
        ? formValues.sourceSalesAreaId
        : salesAreas[0]?.id || "",
      sourceSalesAreaName: isSourceAreaLocked
        ? formValues.sourceSalesAreaName
        : salesAreas[0]?.name || "",
      date: isDateLocked ? formValues.date : initialFormValues.date,
      movementType: isInTypeLocked
        ? formValues.movementType
        : initialFormValues.movementType,
      destinationWarehouseId: "",
      destinationWarehouseName: "",
      destinationSalesAreaId: isDestAreaLocked
        ? formValues.destinationSalesAreaId
        : "",
      destinationSalesAreaName: isDestAreaLocked
        ? formValues.destinationSalesAreaName
        : "",
      movementNumber: isMovementNumberLocked ? formValues.movementNumber : "",
      productId: "",
      productName: "",
    });

    // Reset products to match the cleaned sales area
    const firstSalesArea = salesAreas[0];
    if (firstSalesArea && firstSalesArea.salesAreaInventories) {
      setProducts(
        firstSalesArea.salesAreaInventories.map((inv) => ({
          ...inv.product,
          stock: inv.quantity,
        })),
      );
    } else {
      setProducts(initialProducts);
    }
  };

  const handleCancel = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      sourceSalesAreaId: isSourceAreaLocked
        ? formValues.sourceSalesAreaId
        : salesAreas[0]?.id || "",
      sourceSalesAreaName: isSourceAreaLocked
        ? formValues.sourceSalesAreaName
        : salesAreas[0]?.name || "",
      date: isDateLocked ? formValues.date : initialFormValues.date,
      movementType: isInTypeLocked
        ? formValues.movementType
        : initialFormValues.movementType,
      destinationWarehouseId: "",
      destinationWarehouseName: "",
      destinationSalesAreaId: isDestAreaLocked
        ? formValues.destinationSalesAreaId
        : "",
      destinationSalesAreaName: isDestAreaLocked
        ? formValues.destinationSalesAreaName
        : "",
      movementNumber: isMovementNumberLocked ? formValues.movementNumber : "",
      productId: "",
      productName: "",
    });
    setEditIndex(null);

    // Reset products to match the default sales area
    const firstSalesArea = salesAreas[0];
    if (firstSalesArea && firstSalesArea.salesAreaInventories) {
      setProducts(
        firstSalesArea.salesAreaInventories.map((inv) => ({
          ...inv.product,
          stock: inv.quantity,
        })),
      );
    } else {
      setProducts(initialProducts);
    }
  };

  const handleEdit = (index: number) => {
    const row = rows[index];
    setFormValues({ ...row });
    setEditIndex(index);
  };

  const handleRemove = (index: number) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    toast.success("Fila eliminada correctamente.");
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    fetcher.submit({ rows: JSON.stringify(rows) }, { method: "post" });
  };

  // Handle fetcher state changes
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsSubmitting(false);

      if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleNewProduct = (newProduct: Product) => {
    const productToAdd: ProductWithStock = {
      id: newProduct.id,
      categoryId: newProduct.categoryId,
      name: newProduct.name,
      costPrice: newProduct.costPrice,
      salePrice: newProduct.salePrice,
      unit: newProduct.unit,
      stock: 0,
    };

    setProducts((prev) => [...prev, productToAdd]);

    setFormValues((prev) => ({
      ...prev,
      productId: newProduct.id,
      productName: newProduct.name,
    }));

    toast.success("Producto agregado y seleccionado exitosamente");
  };

  const totalCostAmount = rows.reduce(
    (sum, row) => sum + (row.costAmount || 0),
    0,
  );

  const totalSaleAmount = rows.reduce(
    (sum, row) => sum + (row.saleAmount || 0),
    0,
  );

  const formatCurrency = (value: number, type?: string) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: type === "cost" ? 6 : 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Movimiento</CardTitle>
        </CardHeader>
        <form className="flex flex-col gap-4" onSubmit={handleAddOrSave}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <input
              type="hidden"
              name="userId"
              defaultValue={user.id}
              required
            />
            <div className="grid gap-2">
              <Label htmlFor="date" className="pl-1 text-sm font-medium">
                Fecha
              </Label>
              <InputGroup>
                <DatePickerPlus
                  name="date"
                  className="w-full min-w-0 sm:min-w-40"
                  value={formValues.date}
                  onChange={(value) => handleChange("date", value)}
                  disabled={isDateLocked}
                  required
                />
                <Toggle
                  pressed={isDateLocked}
                  onPressedChange={setIsDateLocked}
                  aria-label={
                    isDateLocked ? "Desbloquear fecha" : "Bloquear fecha"
                  }
                  title={
                    isDateLocked ? "Fecha bloqueada" : "Fecha desbloqueada"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isDateLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="sourceSalesAreaId"
                className="pl-1 text-sm font-medium"
              >
                Área de Venta Origen
              </Label>
              <InputGroup>
                <ComboboxPlus
                  name="sourceSalesAreaId"
                  className="w-full min-w-0 sm:min-w-40"
                  options={salesAreas.map((sa) => ({
                    value: sa.id,
                    label: sa.name,
                  }))}
                  value={formValues.sourceSalesAreaId}
                  onChange={(value) => {
                    const sa = salesAreas.find((s) => s.id === value);
                    if (sa) {
                      handleChange("sourceSalesAreaId", value);
                      setFormValues((prev) => ({
                        ...prev,
                        sourceSalesAreaName: sa.name,
                      }));
                    }
                  }}
                  disable={isSourceAreaLocked}
                  required
                />
                <Toggle
                  pressed={isSourceAreaLocked}
                  onPressedChange={setIsSourceAreaLocked}
                  aria-label={
                    isSourceAreaLocked
                      ? "Desbloquear área de venta origen"
                      : "Bloquear área de venta origen"
                  }
                  title={
                    isSourceAreaLocked
                      ? "Área de venta origen bloqueada"
                      : "Área de venta origen desbloqueada"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isSourceAreaLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="movementType"
                className="pl-1 text-sm font-medium"
              >
                Tipo de Movimiento
              </Label>
              <InputGroup>
                <SelectList
                  name="movementType"
                  className="w-full min-w-0 sm:min-w-40"
                  options={movementTypeOptions}
                  value={formValues.movementType}
                  onChange={(value) => handleChange("movementType", value)}
                  disabled={isInTypeLocked}
                  required
                />
                <Toggle
                  pressed={isInTypeLocked}
                  onPressedChange={setIsInTypeLocked}
                  aria-label={
                    isInTypeLocked
                      ? "Desbloquear tipo de movimiento"
                      : "Bloquear tipo de movimiento"
                  }
                  title={
                    isInTypeLocked
                      ? "Tipo de movimiento bloqueado"
                      : "Tipo de movimiento desbloqueado"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isInTypeLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            {formValues.movementType === "DEVOLUCION" && (
              <div className="grid gap-2">
                <Label
                  htmlFor="destinationWarehouseId"
                  className="pl-1 text-sm font-medium"
                >
                  Almacén Destino
                </Label>
                <ComboboxPlus
                  name="destinationWarehouseId"
                  className="w-full min-w-0 sm:min-w-40"
                  options={warehouses.map((wh) => ({
                    value: wh.id,
                    label: wh.name,
                  }))}
                  value={formValues.destinationWarehouseId}
                  onChange={(value) => {
                    const wh = warehouses.find((w) => w.id === value);
                    if (wh) {
                      handleChange("destinationWarehouseId", value);
                      setFormValues((prev) => ({
                        ...prev,
                        destinationWarehouseName: wh.name,
                      }));
                    }
                  }}
                  required
                />
              </div>
            )}

            {formValues.movementType === "TRASLADO" && (
              <div className="grid gap-2">
                <Label
                  htmlFor="destinationSalesAreaId"
                  className="pl-1 text-sm font-medium"
                >
                  Área de Venta Destino
                </Label>
                <InputGroup>
                  <ComboboxPlus
                    name="destinationSalesAreaId"
                    className="w-full min-w-0 sm:min-w-40"
                    options={salesAreas
                      .filter((sa) => sa.id !== formValues.sourceSalesAreaId)
                      .map((sa) => ({
                        value: sa.id,
                        label: sa.name,
                      }))}
                    value={formValues.destinationSalesAreaId}
                    onChange={(value) => {
                      const sa = salesAreas.find((s) => s.id === value);
                      if (sa) {
                        handleChange("destinationSalesAreaId", value);
                        setFormValues((prev) => ({
                          ...prev,
                          destinationSalesAreaName: sa.name,
                        }));
                      }
                    }}
                    disable={isDestAreaLocked}
                    required
                  />
                  <Toggle
                    pressed={isDestAreaLocked}
                    onPressedChange={setIsDestAreaLocked}
                    aria-label={
                      isDestAreaLocked
                        ? "Desbloquear área de venta destino"
                        : "Bloquear área de venta destino"
                    }
                    title={
                      isDestAreaLocked
                        ? "Área de venta destino bloqueada"
                        : "Área de venta destino desbloqueada"
                    }
                    className="hover:bg-transparent data-[state=on]:bg-transparent"
                  >
                    {isDestAreaLocked ? <LockOpenIcon /> : <LockIcon />}
                  </Toggle>
                </InputGroup>
              </div>
            )}
            <div className="grid gap-2">
              <Label
                htmlFor="movementNumber"
                className="pl-1 text-sm font-medium"
              >
                No. de Movimiento
              </Label>
              <InputGroup>
                <Input
                  id="movementNumber"
                  name="movementNumber"
                  value={formValues.movementNumber}
                  onChange={(event) =>
                    handleChange("movementNumber", event.target.value)
                  }
                  className="w-full min-w-0 sm:min-w-40"
                  disabled={isMovementNumberLocked}
                  required
                />
                <Toggle
                  pressed={isMovementNumberLocked}
                  onPressedChange={setIsMovementNumberLocked}
                  aria-label={
                    isMovementNumberLocked
                      ? "Desbloquear número de movimiento"
                      : "Bloquear número de movimiento"
                  }
                  title={
                    isMovementNumberLocked
                      ? "Número de movimiento bloqueado"
                      : "Número de movimiento desbloqueado"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isMovementNumberLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product" className="pl-1 text-sm font-medium">
                Producto
              </Label>
              <InputGroup>
                <ComboboxPlus
                  name="product"
                  className="w-full min-w-0 sm:min-w-40"
                  options={products.map((prod) => ({
                    value: prod.id,
                    label: `${prod.name} (${prod.stock || 0} disponibles)`,
                    stock: prod.stock || 0,
                  }))}
                  value={formValues.productId}
                  onChange={(value) => {
                    const prod = products.find((p) => p.id === value);
                    if (prod) {
                      handleChange("productId", prod.id);
                      setFormValues((prev) => ({
                        ...prev,
                        productName: prod.name,
                      }));
                    }
                  }}
                  disable={isProductLocked}
                  required
                />
                <Toggle
                  pressed={isProductLocked}
                  onPressedChange={setIsProductLocked}
                  aria-label={
                    isProductLocked
                      ? "Desbloquear producto"
                      : "Bloquear producto"
                  }
                  title={
                    isProductLocked
                      ? "Producto bloqueado"
                      : "Producto desbloqueado"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isProductLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="pl-1 text-sm font-medium">
                Cantidad
              </Label>
              <Input
                id="quantity"
                name="quantity"
                value={formValues.quantity}
                onChange={(event) =>
                  handleChange("quantity", event.target.value)
                }
                type="number"
                min={1}
                className="w-full h-10 min-w-0 sm:min-w-40"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <CardAction className="grid grid-cols-2 gap-2 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                className="min-w-24 cursor-pointer h-10 sm:min-w-32 text-xs sm:text-sm"
                onClick={editIndex !== null ? handleCancel : handleClean}
              >
                {editIndex !== null ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <BanIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Cancelar</span>
                    <span className="sm:hidden">Cancel</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <EraserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Borrar</span>
                    <span className="sm:hidden">Limpiar</span>
                  </div>
                )}
              </Button>
              <Button
                type="submit"
                className="min-w-24 h-10 sm:min-w-32 text-xs sm:text-sm"
              >
                {editIndex !== null ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <SaveIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Guardar</span>
                    <span className="sm:hidden">Guardar</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Agregar</span>
                    <span className="sm:hidden">Agregar</span>
                  </div>
                )}
              </Button>
            </CardAction>
          </CardFooter>
        </form>
      </Card>
      {/* Table */}
      <Card>
        <CardContent className="relative">
          {editIndex !== null && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-not-allowed z-10 rounded-lg" />
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-xs sm:text-sm">
                  Fecha
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">
                  Área Origen
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">
                  Tipo
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">
                  Destino
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm hidden sm:table-cell">
                  Movimiento
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">
                  Producto
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm">
                  Cant.
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
                  Costo
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm hidden md:table-cell">
                  Venta
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <WarehouseIcon className="size-20 sm:size-32" />
                      <p className="font-semibold text-sm sm:text-base px-4">
                        No hay movimientos agregados. Complete el formulario y
                        haga clic en "Agregar".
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-secondary/50" : ""
                    } hover:bg-muted/50`}
                  >
                    <TableCell className="text-xs sm:text-sm">
                      {row.date}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      {row.sourceSalesAreaName}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      {row.movementType}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-32 truncate">
                      {row.movementType === "DEVOLUCION"
                        ? row.destinationWarehouseName
                        : row.destinationSalesAreaName}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                      {row.movementNumber}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-32 truncate">
                      {row.productName}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {row.quantity}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell">
                      {formatCurrency(row.costAmount, "cost")}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm hidden md:table-cell">
                      {formatCurrency(row.saleAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          className="cursor-pointer h-8 w-8 sm:h-9 sm:w-9"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(index)}
                          title="Editar"
                        >
                          <PencilLineIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          className="cursor-pointer h-8 w-8 sm:h-9 sm:w-9"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(index)}
                          title="Eliminar"
                        >
                          <Trash2Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="text-right font-semibold bg-muted/50">
                <TableCell colSpan={6} className="text-xs sm:text-sm">
                  TOTAL
                </TableCell>
                <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                  {formatCurrency(totalCostAmount, "cost")}
                </TableCell>
                <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                  {formatCurrency(totalSaleAmount)}
                </TableCell>
                <TableCell
                  className="text-xs sm:text-sm lg:hidden md:hidden"
                  colSpan={2}
                >
                  <div className="text-left">
                    <div>C: {formatCurrency(totalCostAmount, "cost")}</div>
                    <div>V: {formatCurrency(totalSaleAmount)}</div>
                  </div>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <CardAction>
            <Button
              className="min-w-24 h-10 sm:min-w-32 text-xs sm:text-sm"
              disabled={rows.length === 0 || editIndex !== null || isSubmitting}
              onClick={() => setShowConfirmDialog(true)}
            >
              <CalculatorIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSubmitting ? "Procesando..." : "Contabilizar"}
            </Button>
          </CardAction>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong>{" "}
              movimiento{rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>{formatCurrency(totalCostAmount, "cost")}</strong>.
              <br />
              <br />
              Esta acción registrará los movimientos en el sistema de manera
              permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Form for Submission */}
      <fetcher.Form>
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      </fetcher.Form>
    </div>
  );
}
