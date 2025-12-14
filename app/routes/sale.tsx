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
interface SaleRow {
  userId: string;
  salesAreaId: string;
  salesAreaName: string;
  date: string;
  payMethod: string;
  productId: string;
  productName: string;
  quantity: string;
  saleAmount: number | null;
  costAmount: number | null;
}

interface SalesAreaInventory {
  id: string;
  quantity: number;
  product: Product;
}

interface SaleArea {
  id: string;
  name: string;
  salesAreaInventories: SalesAreaInventory[];
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
  salesAreas: SaleArea[];
  warehouseInventories: SalesAreaInventory[];
  destinations: {
    stores: Destination[];
    salesAreas: Destination[];
  };
  products: Product[];
}

// Constants
const payMethods = [
  { value: "EFECTIVO", label: "EFECTIVO" },
  { value: "TRANSFERMOVIL", label: "TRANSFERMOVIL" },
  { value: "ENZONA", label: "ENZONA" },
];

const initialFormValues: SaleRow = {
  userId: "",
  salesAreaId: "",
  salesAreaName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  payMethod: "",
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

  let rows: SaleRow[];
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

      return {
        userId: row.userId,
        salesAreaId: row.salesAreaId,
        date: parsedDate,
        payMethod: row.payMethod,
        productId: row.productId,
        quantity,
        costAmount: row.costAmount ? Number(row.costAmount) : 0,
        saleAmount: row.saleAmount ? Number(row.saleAmount) : 0,
      };
    });

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        data.map(async (entry) => {
          await tx.sale.create({ data: entry });

          const salesAreaInventory = await tx.salesAreaInventory.findUnique({
            where: {
              salesAreaId_productId: {
                salesAreaId: entry.salesAreaId,
                productId: entry.productId,
              },
            },
          });

          if (salesAreaInventory) {
            await tx.salesAreaInventory.update({
              where: { id: salesAreaInventory.id },
              data: { quantity: { decrement: entry.quantity } },
            });
          } else {
            throw new Error(
              `No hay inventario del producto en el área de venta`
            );
          }
        })
      );
    });

    return redirect("/main/sale-area/sale?success=1");
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
export default function Sale() {
  const { user, salesAreas } = useOutletContext<OutletContext>();

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<SaleRow>({
    ...initialFormValues,
    userId: user.id,
    salesAreaId: salesAreas[0]?.id || "",
    salesAreaName: salesAreas[0]?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const availableProducts =
    salesAreas
      .find((sa) => sa.id === formValues.salesAreaId)
      ?.salesAreaInventories.filter((inv) => inv.quantity > 0)
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

  const handleChange = (name: keyof SaleRow, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (name === "salesAreaId") {
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

    if (!formValues.salesAreaId) {
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

    const amount = calculateAmount(formValues.productId, formValues.quantity);

    const rowWithAmount: SaleRow = {
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
      salesAreaId: salesAreas[0]?.id || "",
      salesAreaName: salesAreas[0]?.name || "",
    });
  };

  const handleCancel = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      salesAreaId: salesAreas[0]?.id || "",
      salesAreaName: salesAreas[0]?.name || "",
    });
    setEditIndex(null);
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
          {salesAreas.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="salesAreaId" className="pl-1">
                Área de Venta
              </Label>
              <ComboboxPlus
                name="salesAreaId"
                className="w-full min-w-40"
                options={salesAreas.map((sa) => ({
                  value: sa.id,
                  label: sa.name,
                }))}
                value={formValues.salesAreaId}
                onChange={(value) => {
                  const wh = salesAreas.find((w) => w.id === value);
                  if (wh) {
                    handleChange("salesAreaId", value);
                    setFormValues((prev) => ({
                      ...prev,
                      salesAreaName: wh.name,
                    }));
                  }
                }}
                required
              />
            </div>
          )}
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
              {salesAreas.length > 1 && <TableHead>Área de Venta</TableHead>}
              <TableHead>Método de Pago</TableHead>
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
                  colSpan={salesAreas.length > 1 ? 11 : 9}
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
                  {salesAreas.length > 1 && (
                    <TableCell>{row.salesAreaName}</TableCell>
                  )}
                  <TableCell>{row.payMethod || "-"}</TableCell>
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
