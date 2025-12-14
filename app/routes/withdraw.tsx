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
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/withdraw";
import { prisma } from "~/lib/prisma";
import {
  BanIcon,
  CalculatorIcon,
  EraserIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  StoreIcon,
  Trash2Icon,
} from "lucide-react";
import { Decimal } from "@prisma/client/runtime/client";

// Types
interface WithdrawRow {
  userId: string;
  salesAreaId: string;
  salesAreaName: string;
  date: string;
  amount: string;
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
const initialFormValues: WithdrawRow = {
  userId: "",
  salesAreaId: "",
  salesAreaName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  amount: "",
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

  let rows: WithdrawRow[];
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

      const amount = parseInt(row.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Cantidad inválida: ${row.amount}`);
      }

      return {
        userId: row.userId,
        salesAreaId: row.salesAreaId,
        date: parsedDate,
        amount: new Decimal(amount),
      };
    });

    await prisma.$transaction(async (tx) => {
      data.forEach(async (entry) => {
        const cashSalesTotal = await tx.sale.aggregate({
          where: {
            salesAreaId: entry.salesAreaId,
            date: entry.date,
            payMethod: "EFECTIVO",
          },
          _sum: { saleAmount: true },
        });

        const totalCashSales = cashSalesTotal._sum.saleAmount || new Decimal(0);

        const existingWithdrawsTotal = await tx.withdraw.aggregate({
          where: { salesAreaId: entry.salesAreaId, date: entry.date },
          _sum: { amount: true },
        });

        const totalExistingWithdraws =
          existingWithdrawsTotal._sum.amount || new Decimal(0);

        const availableCash = totalCashSales.minus(totalExistingWithdraws);

        if (entry.amount.greaterThan(availableCash)) {
          throw new Error(
            `El retiro de ${
              entry.amount
            } excede el efectivo disponible de ${availableCash.toFixed(
              2
            )} para el ${format(entry.date, "dd/MM/yyyy")}`
          );
        }

        await tx.withdraw.create({ data: entry });
      });
    });

    return redirect("/main/sale-area/withdraw?success=1");
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
export default function Withdraw() {
  const { user, salesAreas } = useOutletContext<OutletContext>();

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<WithdrawRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<WithdrawRow>({
    ...initialFormValues,
    userId: user.id,
    salesAreaId: salesAreas[0]?.id || "",
    salesAreaName: salesAreas[0]?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [isLoadingCash, setIsLoadingCash] = useState(false);

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Retiros contabilizadas exitosamente.");
      setRows([]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchAvailableCash = async () => {
      if (!formValues.salesAreaId || !formValues.date) return;

      setIsLoadingCash(true);
      try {
        const parsedDate = parse(formValues.date, "dd/MM/yyyy", new Date());

        if (!isValid(parsedDate)) return;

        const response = await fetch(
          `/api/get-available-cash?salesAreaId=${
            formValues.salesAreaId
          }&date=${format(parsedDate, "yyyy-MM-dd")}`
        );

        const data = await response.json();

        if (data.success) {
          setAvailableCash(data.availableCash);
        }
      } catch (error) {
        toast.error(`Error al obtener efectivo disponible: ${error}`);
      } finally {
        setIsLoadingCash(false);
      }
    };

    fetchAvailableCash();
  }, [formValues.salesAreaId, formValues.date]);

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

  const handleChange = (name: keyof WithdrawRow, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = parseFloat(formValues.amount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    if (!formValues.salesAreaId) {
      toast.error("Debe seleccionar un área de venta.");
      return;
    }

    const totalWithdrawsForDate = rows
      .filter(
        (row) =>
          row.date === formValues.date &&
          row.salesAreaId === formValues.salesAreaId &&
          (editIndex === null || rows.indexOf(row) !== editIndex)
      )
      .reduce((sum, row) => sum + parseFloat(row.amount), 0);

    const remainingCash = availableCash - totalWithdrawsForDate;

    if (amount > remainingCash) {
      toast.error(
        `El retiro excede el efectivo disponible. Disponible: $${remainingCash.toFixed(
          2
        )}`
      );

      return;
    }

    if (editIndex !== null) {
      setRows((prev) =>
        prev.map((row, i) => (i === editIndex ? formValues : row))
      );
      toast.success("Fila actualizada correctamente.");
    } else {
      setRows((prev) => [...prev, formValues]);
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

  const totalAmount = rows.reduce(
    (sum, row) => sum + (parseFloat(row.amount) || 0),
    0
  );

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
                  const sa = salesAreas.find((s) => s.id === value);
                  if (sa) {
                    handleChange("salesAreaId", value);
                    setFormValues((prev) => ({
                      ...prev,
                      salesAreaName: sa.name,
                    }));
                  }
                }}
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="amount" className="pl-1">
              Cantidad{" "}
              {isLoadingCash
                ? "(Cargando...)"
                : `(Disponible: $${availableCash.toFixed(2)})`}
            </Label>
            <Input
              id="amount"
              name="amount"
              value={formValues.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full min-w-40"
              disabled={isLoadingCash}
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
                Cancelar <BanIcon />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Borrar <EraserIcon />
              </div>
            )}
          </Button>
          <Button type="submit" className="min-w-32">
            {editIndex !== null ? (
              <div className="flex items-center gap-2">
                Guardar <SaveIcon />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Agregar <PlusIcon />
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
              <TableHead>Área de Venta</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  <div className="flex flex-col items-center gap-4">
                    <StoreIcon className="size-32" />
                    <p className="font-semibold">
                      No hay salidas agregadas. Complete el formulario y haga
                      clic en "Agregar".
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.salesAreaName}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                        title="Editar"
                      >
                        <PencilLineIcon />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        title="Eliminar"
                      >
                        <Trash2Icon />
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
          {isSubmitting ? "Procesando..." : "Contabilizar"} <CalculatorIcon />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong> retiro
              {rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>${totalAmount.toFixed(2)}</strong>.
              <br />
              <br />
              Esta acción registrará los retiros en el sistema de manera
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
