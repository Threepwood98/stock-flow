import { useState, type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
  redirect,
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
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { format, parse, isValid } from "date-fns";
import { DatePicker } from "~/components/date-picker";
import { SelectList } from "~/components/select-list";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/outflow";
import { prisma } from "~/lib/prisma";
import {
  Ban,
  Calculator,
  Eraser,
  PencilLine,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

// Types
interface OutflowRow {
  userId: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  outType: string;
  destinationId: string;
  destinationName: string;
  payMethod: string;
  outNumber: string;
  productId: string;
  productName: string;
  quantity: string;
  saleAmount: number | null;
  costAmount: number | null;
}

interface WarehouseInventory {
  id: string;
  quantity: number;
  product: Product;
}

interface Warehouse {
  id: string;
  name: string;
  warehouseInventories: WarehouseInventory[];
}

interface Destination {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  warehouseId: string;
  costPrice: { d: Number };
  salePrice: { d: Number };
  unit: string;
}

interface OutletContext {
  user: any;
  selectedStoreId: string;
  warehouses: Warehouse[];
  warehouseInventories: WarehouseInventory[];
  destinations: {
    stores: Destination[];
    salesAreas: Destination[];
  };
  products: Product[];
}

// Constants
const outTypeOptions = [
  { value: "TRASLADO", label: "Por Traslado" },
  { value: "VALE", label: "Por Vale" },
  { value: "VENTA", label: "Por Venta" },
];

const payMethods = [
  { value: "EFECTIVO", label: "EFECTIVO" },
  { value: "TRANSFERMOVIL", label: "TRANSFERMOVIL" },
  { value: "ENZONA", label: "ENZONA" },
];

const initialFormValues: OutflowRow = {
  userId: "",
  warehouseId: "",
  warehouseName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  outType: "",
  destinationId: "",
  destinationName: "",
  payMethod: "",
  outNumber: "",
  productId: "",
  productName: "",
  quantity: "",
  saleAmount: null,
  costAmount: null,
};

// Server Action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawRows = formData.get("rows");

  if (!rawRows) {
    return new Response(
      JSON.stringify({ error: "No hay datos para insertar." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let rows: OutflowRow[];
  try {
    rows = JSON.parse(rawRows as string);
  } catch {
    return new Response(
      JSON.stringify({ error: "Formato inválido de datos." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: "No hay filas para insertar." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
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

      const isTRASLADO = row.outType === "TRASLADO";
      const isVALE = row.outType === "VALE";
      const isVENTA = row.outType === "VENTA";

      return {
        userId: row.userId,
        warehouseId: row.warehouseId,
        outType: row.outType,
        date: parsedDate,
        destinationStoreId: isTRASLADO ? row.destinationId : null,
        destinationSalesAreaId: isVALE ? row.destinationId : null,
        payMethod: isVENTA ? row.payMethod : null,
        outNumber: row.outNumber,
        productId: row.productId,
        quantity,
        costAmount: row.costAmount ? Number(row.costAmount) : 0,
        saleAmount: row.saleAmount ? Number(row.saleAmount) : 0,
      };
    });

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        data.map(async (entry) => {
          await tx.outflow.create({ data: entry });

          const warehouseInventory = await tx.warehouseInventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: entry.warehouseId,
                productId: entry.productId,
              },
            },
          });

          if (warehouseInventory) {
            await tx.warehouseInventory.update({
              where: { id: warehouseInventory.id },
              data: { quantity: { decrement: entry.quantity } },
            });
          } else {
            throw new Error(`No hay inventario del producto en el almacén`);
          }

          if (entry.destinationSalesAreaId) {
            const salesAreaInventory = await tx.salesAreaInventory.findUnique({
              where: {
                salesAreaId_productId: {
                  salesAreaId: entry.destinationSalesAreaId,
                  productId: entry.productId,
                },
              },
            });

            if (salesAreaInventory) {
              await tx.salesAreaInventory.update({
                where: { id: salesAreaInventory.id },
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
        })
      );
    });

    return redirect("/main/warehouse/outflow?success=1");
  } catch (error: any) {
    console.error("❌ Error al insertar:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error al guardar en la base de datos.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Component
export default function Outflow() {
  const { user, warehouses, destinations, warehouseInventories } =
    useOutletContext<OutletContext>();

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<OutflowRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<OutflowRow>({
    ...initialFormValues,
    userId: user.id,
    warehouseId: warehouses[0]?.id || "",
    warehouseName: warehouses[0]?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentDestinations, setCurrentDestinations] = useState<Destination[]>(
    []
  );

  const availableProducts =
    warehouses
      .find((wh) => wh.id === formValues.warehouseId)
      ?.warehouseInventories.filter((inv) => inv.quantity > 0)
      .map((inv) => ({
        id: inv.product.id,
        name: inv.product.name,
        costPrice: inv.product.costPrice,
        salePrice: inv.product.salePrice,
        unit: inv.product.unit,
        availableQuantity: inv.quantity,
      })) || [];

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Salidas contabilizadas exitosamente.");
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

  const handleChange = (name: keyof OutflowRow, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (name === "outType") {
      switch (value) {
        case "TRASLADO":
          setCurrentDestinations(destinations.stores);
          break;
        case "VALE":
          setCurrentDestinations(destinations.salesAreas);
          break;
        case "VENTA":
          setCurrentDestinations([]);
          break;
      }

      setFormValues((prev) => ({
        ...prev,
        outType: value,
        destinationId: "",
        destinationName: "",
        payMethod: "",
      }));
    }

    if (name === "warehouseId") {
      setFormValues((prev) => ({
        ...prev,
        productId: "",
        productName: "",
        quantity: "",
      }));
    }
  };

  const calculateAmount = (
    productId: string,
    quantity: string
  ): { costAmount: number | null; saleAmount: number | null } => {
    const product = availableProducts.find((prod) => prod.id === productId);
    const qty = parseInt(quantity, 10);

    if (!product || isNaN(qty) || qty <= 0) {
      return { costAmount: null, saleAmount: null };
    }

    const costPrice = Number(product.costPrice.d);
    const salePrice = Number(product.salePrice.d);
    return { costAmount: qty * costPrice, saleAmount: qty * salePrice };
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = parseInt(formValues.quantity, 10);

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    if (!formValues.warehouseId) {
      toast.error("Debe seleccionar un almacén.");
      return;
    }

    const product = availableProducts.find(
      (avp) => avp.id === formValues.productId
    );

    if (product && quantity > product.availableQuantity) {
      toast.error(
        `Solo hay ${product.availableQuantity} ${product.unit} disponibles.`
      );
      return;
    }

    if (
      (formValues.outType === "TRASLADO" || formValues.outType === "VALE") &&
      !formValues.destinationId
    ) {
      toast.error("Debe seleccionar un destino.");
      return;
    }

    if (formValues.outType === "VENTA" && !formValues.payMethod) {
      toast.error("Debe seleccionar un método de pago.");
      return;
    }

    const amount = calculateAmount(formValues.productId, formValues.quantity);

    const rowWithAmount: OutflowRow = {
      ...formValues,
      costAmount: amount.costAmount,
      saleAmount: amount.saleAmount,
    };

    if (editIndex !== null) {
      setRows((prev) =>
        prev.map((row, i) => (i === editIndex ? rowWithAmount : row))
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
      warehouseId: warehouses[0]?.id || "",
      warehouseName: warehouses[0]?.name || "",
    });
    setCurrentDestinations([]);
  };

  const handleCancel = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      warehouseId: warehouses[0]?.id || "",
      warehouseName: warehouses[0]?.name || "",
    });
    setEditIndex(null);
    setCurrentDestinations([]);
  };

  const handleEdit = (index: number) => {
    const row = rows[index];
    setFormValues({ ...row });
    setEditIndex(index);

    switch (row.outType) {
      case "TRASLADO":
        setCurrentDestinations(destinations.stores);
        break;
      case "VALE":
        setCurrentDestinations(destinations.salesAreas);
        break;
      case "VENTA":
        setCurrentDestinations([]);
        break;
    }
  };

  const handleRemove = (index: number) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    toast.success("Fila eliminada correctamente.");
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    document
      .getElementById("submit-form")
      ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.costAmount || 0), 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <form className="flex flex-col gap-4" onSubmit={handleAddOrSave}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <input
            name="userId"
            defaultValue={user.id}
            className="hidden"
            required
          />
          <div className="grid gap-2">
            <Label htmlFor="date" className="pl-1">
              Fecha
            </Label>
            <DatePicker
              name="date"
              className="w-full min-w-40"
              value={formValues.date}
              onChange={(value) => handleChange("date", value)}
              required
            />
          </div>
          {warehouses.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="warehouseId" className="pl-1">
                Almacén
              </Label>
              <ComboboxPlus
                name="warehouseId"
                className="w-full min-w-40"
                options={warehouses.map((wh) => ({
                  value: wh.id,
                  label: wh.name,
                }))}
                value={formValues.warehouseId}
                onChange={(value) => {
                  const wh = warehouses.find((w) => w.id === value);
                  if (wh) {
                    handleChange("warehouseId", value);
                    setFormValues((prev) => ({
                      ...prev,
                      warehouseName: wh.name,
                    }));
                  }
                }}
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="outType" className="pl-1">
              Tipo de Salida
            </Label>
            <SelectList
              name="outType"
              className="w-full min-w-40"
              options={outTypeOptions}
              value={formValues.outType}
              onChange={(value) => handleChange("outType", value)}
              required
            />
          </div>
          {formValues.outType !== "VENTA" && (
            <div className="grid gap-2">
              <Label htmlFor="destination" className="pl-1">
                Destino
              </Label>
              <ComboboxPlus
                name="destination"
                className="w-full min-w-40"
                options={currentDestinations.map((dest) => ({
                  value: dest.id,
                  label: dest.name,
                }))}
                value={formValues.destinationId}
                onChange={(value) => {
                  const dest = currentDestinations.find((d) => d.id === value);
                  if (dest) {
                    handleChange("destinationId", dest.id);
                    setFormValues((prev) => ({
                      ...prev,
                      destinationName: dest.name,
                    }));
                  }
                }}
                required
              />
            </div>
          )}
          {formValues.outType === "VENTA" && (
            <div className="grid gap-2">
              <Label htmlFor="payMethod" className="pl-1">
                Método de Pago
              </Label>
              <SelectList
                name="payMethod"
                className="w-full min-w-40"
                options={payMethods}
                value={formValues.payMethod}
                onChange={(value) => handleChange("payMethod", value)}
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="outNumber" className="pl-1">
              No. de Salida
            </Label>
            <Input
              id="outNumber"
              name="outNumber"
              value={formValues.outNumber}
              onChange={(event) =>
                handleChange("outNumber", event.target.value)
              }
              className="w-full min-w-40"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product" className="pl-1">
              Producto
            </Label>
            <ComboboxPlus
              name="product"
              className="w-full min-w-40"
              placeholder={
                availableProducts.length === 0
                  ? "Sin productos disponibles"
                  : "Selecciona..."
              }
              options={availableProducts.map((prod) => ({
                value: prod.id,
                label: `${prod.name} (${prod.availableQuantity} ${prod.unit})`,
              }))}
              value={formValues.productId}
              onChange={(value) => {
                const prod = availableProducts.find((p) => p.id === value);
                if (prod) {
                  handleChange("productId", prod.id);
                  setFormValues((prev) => ({
                    ...prev,
                    productName: prod.name,
                  }));
                }
              }}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity" className="pl-1">
              Cantidad
            </Label>
            <Input
              id="quantity"
              name="quantity"
              value={formValues.quantity}
              onChange={(event) => handleChange("quantity", event.target.value)}
              type="number"
              min={1}
              className="w-full min-w-40"
              required
            />
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="ghost"
            className="min-w-32 cursor-pointer"
            onClick={editIndex !== null ? handleCancel : handleClean}
          >
            {editIndex !== null ? (
              <div className="flex items-center gap-2">
                Cancelar <Ban />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Borrar <Eraser />
              </div>
            )}
          </Button>
          <Button type="submit" className="min-w-32">
            {editIndex !== null ? (
              <div className="flex items-center gap-2">
                Guardar <Save />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Agregar <Plus />
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="h-full border rounded-lg relative">
        {(rows.length === 0 || editIndex !== null) && (
          <div className="absolute inset-0 bg-white/50 cursor-not-allowed z-10 rounded-lg" />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {warehouses.length > 1 && <TableHead>Almacén</TableHead>}
              <TableHead>Tipo de Salida</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead>No. de Salida</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Importe de Costo</TableHead>
              <TableHead>Importe de Venta</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={warehouses.length > 1 ? 11 : 9}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay salidas agregadas. Complete el formulario y haga clic
                  en "Agregar".
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  {warehouses.length > 1 && (
                    <TableCell>{row.warehouseName}</TableCell>
                  )}
                  <TableCell>{row.outType}</TableCell>
                  <TableCell>{row.destinationName || "-"}</TableCell>
                  <TableCell>{row.payMethod || "-"}</TableCell>
                  <TableCell>{row.outNumber}</TableCell>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>${row.costAmount?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell>${row.saleAmount?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                        title="Editar"
                      >
                        <PencilLine />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        title="Eliminar"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary and Submit */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          Total: ${totalAmount.toFixed(2)} ({rows.length} salida
          {rows.length !== 1 ? "s" : ""})
        </div>
        <Button
          className="min-w-32 cursor-pointer"
          disabled={rows.length === 0 || editIndex !== null || isSubmitting}
          onClick={() => setShowConfirmDialog(true)}
        >
          {isSubmitting ? "Procesando..." : "Contabilizar"} <Calculator />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong> salida
              {rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>${totalAmount.toFixed(2)}</strong>.
              <br />
              <br />
              Esta acción registrará las salidas en el sistema de manera
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
      <Form method="post" id="submit-form" className="hidden">
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      </Form>
    </div>
  );
}
