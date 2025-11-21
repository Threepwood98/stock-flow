import { useState, type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import {
  IconCalculator,
  IconCancel,
  IconClearAll,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
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
import { Combobox } from "~/components/combobox";
import type { Route } from "./+types/inflows";
import { prisma } from "~/lib/prisma";

// Types
interface InflowRow {
  date: string;
  type: string;
  provider_id: string;
  provider_name: string;
  payment: string;
  in_number: string;
  serial: string;
  product_id: string;
  product_name: string;
  quantity: string;
  amount: number | null;
}

interface Provider {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code_id: string;
  name: string;
  cost_price: { d: string | number };
  sale_price: { d: string | number };
  um: string;
}

// Constants
const inTypeOptions = [
  { value: "FACTURA", label: "Por Factura" },
  { value: "TRASLADO", label: "Por Traslado" },
];

const payTypeOptions = [
  { value: "CHEQUE", label: "Por Cheque" },
  { value: "EFECTIVO", label: "Por Efectivo" },
];

const initialFormValues: InflowRow = {
  date: format(new Date(), "dd/MM/yyyy"),
  type: "",
  provider_id: "",
  provider_name: "",
  payment: "",
  in_number: "",
  serial: "",
  product_id: "",
  product_name: "",
  quantity: "",
  amount: null,
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

  let rows: InflowRow[];
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
    const warehouse_id = "cmi7pmlnl0002r8w4kedu5n4b";

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
        warehouse_id,
        type: row.type,
        date: parsedDate,
        provider_id: row.provider_id,
        payment: row.payment,
        in_number: row.in_number,
        serial: row.serial,
        product_id: row.product_id,
        quantity,
        amount: row.amount ? Number(row.amount) : 0,
      };
    });

    await prisma.$transaction(
      data.map((entry) => prisma.inflows.create({ data: entry }))
    );

    return redirect("/dashboard/almacen/entrada?success=1");
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
export default function Inflows() {
  const { providers, products } = useOutletContext<{
    providers: Provider[];
    products: Product[];
  }>();

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<InflowRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<InflowRow>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Entradas contabilizadas exitosamente.");

      // Clear rows after successful submission
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

  const handleChange = (name: keyof InflowRow, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const calculateAmount = (
    productId: string,
    quantity: string
  ): number | null => {
    const product = products.find((p) => p.id === productId);
    const qty = parseInt(quantity, 10);

    if (!product || isNaN(qty) || qty <= 0) {
      return null;
    }

    const price = Number(product.sale_price.d);
    return qty * price;
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate quantity
    const quantity = parseInt(formValues.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    const amount = calculateAmount(formValues.product_id, formValues.quantity);
    const rowWithAmount: InflowRow = { ...formValues, amount };

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
    setFormValues(initialFormValues);
  };

  const handleCancel = () => {
    setFormValues(initialFormValues);
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
    // El formulario se enviará automáticamente
    document
      .getElementById("submit-form")
      ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleAddOrSave}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
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
          <div className="grid gap-2">
            <Label htmlFor="in_type" className="pl-1">
              Tipo de Entrada
            </Label>
            <SelectList
              name="in_type"
              className="w-full min-w-40"
              options={inTypeOptions}
              value={formValues.type}
              onChange={(value) => handleChange("type", value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="provider" className="pl-1">
              Proveedor
            </Label>
            <Combobox
              name="provider"
              className="w-full min-w-40"
              classNameOptions="w-full min-w-40"
              options={providers.map((prov) => ({
                value: prov.id,
                label: prov.name,
              }))}
              value={formValues.provider_id}
              onChange={(value) => {
                const prov = providers.find((p) => p.id === value);
                if (prov) {
                  handleChange("provider_id", prov.id);
                  handleChange("provider_name", prov.name);
                }
              }}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pay_type" className="pl-1">
              Método de Pago
            </Label>
            <SelectList
              name="payment"
              className="w-full min-w-40"
              options={payTypeOptions}
              value={formValues.payment}
              onChange={(value) => handleChange("payment", value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="in_number" className="pl-1">
              No. de Factura
            </Label>
            <Input
              id="in_number"
              name="in_number"
              value={formValues.in_number}
              onChange={(event) =>
                handleChange("in_number", event.target.value)
              }
              className="w-full min-w-40"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="serial" className="pl-1">
              No. Consecutivo
            </Label>
            <Input
              id="serial"
              name="serial"
              value={formValues.serial}
              onChange={(event) => handleChange("serial", event.target.value)}
              className="w-full min-w-40"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product" className="pl-1">
              Producto
            </Label>
            <Combobox
              name="product"
              className="w-full min-w-40"
              classNameOptions="w-full min-w-40"
              options={products.map((prod) => ({
                value: prod.id,
                label: prod.name,
              }))}
              value={formValues.product_id}
              onChange={(value) => {
                const prod = products.find((p) => p.id === value);
                if (prod) {
                  handleChange("product_id", prod.id);
                  handleChange("product_name", prod.name);
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
                Cancelar <IconCancel />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Limpiar <IconClearAll />
              </div>
            )}
          </Button>
          <Button type="submit" className="min-w-32 cursor-pointer">
            {editIndex !== null ? (
              <div className="flex items-center gap-2">
                Guardar <IconEdit />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Agregar <IconPlus />
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
              <TableHead>Tipo</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Consecutivo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay entradas agregadas. Complete el formulario y haga clic
                  en "Agregar".
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.provider_name}</TableCell>
                  <TableCell>{row.payment}</TableCell>
                  <TableCell>{row.in_number}</TableCell>
                  <TableCell>{row.serial}</TableCell>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${row.amount?.toFixed(2) ?? "0.00"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                        title="Editar"
                      >
                        <IconEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        title="Eliminar"
                      >
                        <IconTrash className="w-4 h-4" />
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
          Total: ${totalAmount.toFixed(2)} ({rows.length} entrada
          {rows.length !== 1 ? "s" : ""})
        </div>
        <Button
          type="button"
          className="min-w-32 cursor-pointer"
          disabled={rows.length === 0 || editIndex !== null || isSubmitting}
          onClick={() => setShowConfirmDialog(true)}
        >
          {isSubmitting ? "Procesando..." : "Contabilizar"} <IconCalculator />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong>{" "}
              entrada{rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>${totalAmount.toFixed(2)}</strong>.
              <br />
              <br />
              Esta acción registrará las entradas en el sistema de manera
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
