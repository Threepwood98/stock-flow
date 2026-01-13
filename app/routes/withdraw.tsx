import { useState, useCallback, useMemo, type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
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
import { InputGroup } from "~/components/ui/input-group";
import { Toggle } from "~/components/ui/toggle";
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
import { DatePicker } from "~/components/date-picker";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/withdraw";
import { prisma } from "@/lib/prisma";
import {
  BanIcon,
  CalculatorIcon,
  EraserIcon,
  LockIcon,
  LockOpenIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  StoreIcon,
  Trash2Icon,
} from "lucide-react";
import { Decimal } from "@prisma/client/runtime/client";
import type { OutletContext } from "@/lib/types/types";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface WithdrawRow {
  userId: string;
  salesAreaId: string;
  salesAreaName: string;
  date: string;
  amount: number;
}
const initialFormValues: WithdrawRow = {
  userId: "",
  salesAreaId: "",
  salesAreaName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  amount: 0,
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
    const parsed = JSON.parse(rawRows as string);
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array of rows");
    }
    rows = parsed;
  } catch {
    return new Response(
      JSON.stringify({ error: "Formato inválido de datos." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (rows.length === 0) {
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

const amount = row.amount;
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Cantidad inválida: ${amount}`);
      }

      return {
        userId: row.userId,
        salesAreaId: row.salesAreaId,
        date: parsedDate,
        amount: new Decimal(amount),
      };
    });

    await prisma.$transaction(async (tx) => {
      for (const entry of data) {
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
            `La extracción de ${
              entry.amount
            } excede el efectivo disponible de ${availableCash.toFixed(
              2
            )} para el ${format(entry.date, "dd/MM/yyyy")}`
          );
        }

        await tx.withdraw.create({ data: entry });
      }
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
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [isSalesAreaLocked, setIsSalesAreaLocked] = useState(false);

  const fetcher = useFetcher();

  // Memoized functions
  const resetForm = useCallback((preserveLocks: boolean = false) => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      salesAreaId: preserveLocks && isSalesAreaLocked
        ? formValues.salesAreaId
        : salesAreas[0]?.id || "",
      salesAreaName: preserveLocks && isSalesAreaLocked
        ? formValues.salesAreaName
        : salesAreas[0]?.name || "",
      date: preserveLocks && isDateLocked ? formValues.date : initialFormValues.date,
    });
  }, [user.id, salesAreas, isSalesAreaLocked, isDateLocked, formValues.salesAreaId, formValues.salesAreaName, formValues.date]);

  const handleClean = useCallback(() => {
    resetForm(true);
  }, [resetForm]);

  const handleCancel = useCallback(() => {
    resetForm(true);
    setEditIndex(null);
  }, [resetForm]);

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Retiros contabilizadas exitosamente.");
      setRows([]);
    }
    if (searchParams.get("error")) {
      toast.error(searchParams.get("error") || "Error desconocido");
    }
  }, [searchParams]);

  // Handle fetcher state
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
      setIsSubmitting(false);
    }
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    let isMounted = true;
    
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

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();

        if (data.success && isMounted) {
          setAvailableCash(data.availableCash);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(`Error al obtener efectivo disponible: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCash(false);
        }
      }
    };

    fetchAvailableCash();
    
    return () => {
      isMounted = false;
    };
  }, [formValues.salesAreaId, formValues.date, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editIndex !== null) {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editIndex, handleCancel]);

const handleChange = useCallback((name: keyof WithdrawRow, value: string) => {
    if (name === "amount") {
      // Allow only valid decimal numbers
      const cleanValue = value.replace(/[^\d.]/g, '');
      const numValue = parseFloat(cleanValue) || 0;
      setFormValues((prev) => ({ ...prev, [name]: Math.max(0, numValue) }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = formValues.amount;

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
      .reduce((sum, row) => sum + row.amount, 0);

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

  const totalAmount = useMemo(() => 
    rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  const formatCurrency = useCallback((value: number, type?: string) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: type === "cost" ? 6 : 2,
      maximumFractionDigits: 6,
    }).format(value);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Caja Extra</CardTitle>
        </CardHeader>
        <form className="flex flex-col gap-4" onSubmit={handleAddOrSave}>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
              <InputGroup>
                <DatePicker
                  name="date"
                  className="w-full min-w-40"
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
            {salesAreas.length > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="salesAreaId" className="pl-1">
                  Área de Venta
                </Label>
                <InputGroup>
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
                    disable={isSalesAreaLocked}
                    required
                  />
                  <Toggle
                    pressed={isSalesAreaLocked}
                    onPressedChange={setIsSalesAreaLocked}
                    aria-label={
                      isSalesAreaLocked
                        ? "Desbloquear área de venta"
                        : "Bloquear área de venta"
                    }
                    title={
                      isSalesAreaLocked
                        ? "Área de venta bloqueada"
                        : "Área de venta desbloqueada"
                    }
                    className="hover:bg-transparent data-[state=on]:bg-transparent"
                  >
                    {isSalesAreaLocked ? <LockOpenIcon /> : <LockIcon />}
                  </Toggle>
                </InputGroup>
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
                value={formValues.amount.toString()}
                onChange={(event) => handleChange("amount", event.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full min-w-40"
                disabled={isLoadingCash}
                min="0"
                step="0.01"
                required
                aria-label="Cantidad a retirar"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <CardAction className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
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
            </CardAction>
          </CardFooter>
        </form>
      </Card>
      {/* Table */}
      <Card>
        <CardContent className="relative">
          {editIndex !== null && (
            <div className="absolute inset-0 bg-white/50 cursor-not-allowed z-10 rounded-lg" />
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Área de Venta</TableHead>
                <TableHead className="text-right font-semibold">
                  Cantidad
                </TableHead>
                <TableHead className="font-semibold">Acciones</TableHead>
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
                        No hay extracciones agregadas. Complete el formulario y
                        haga clic en "Agregar".
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                useMemo(() => 
                  rows.map((row, index) => (
                    <TableRow
                      key={`${index}-${row.date}-${row.salesAreaId}`}
                      className={`${index % 2 === 0 ? "bg-secondary" : ""}`}
                    >
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.salesAreaName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" role="group" aria-label="Acciones de fila">
                          <Button
                            className="cursor-pointer"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(index)}
                            title="Editar fila"
                            aria-label={`Editar fila ${index + 1}`}
                          >
                            <PencilLineIcon />
                          </Button>
                          <Button
                            className="cursor-pointer"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            title="Eliminar fila"
                            aria-label={`Eliminar fila ${index + 1}`}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )),
                [rows, formatCurrency, handleEdit, handleRemove])
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="text-right font-semibold">
                <TableCell colSpan={2}>TOTAL</TableCell>
                <TableCell>{formatCurrency(totalAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <CardAction>
            <Button
              className="min-w-32"
              disabled={rows.length === 0 || editIndex !== null || isSubmitting || fetcher.state !== "idle"}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isSubmitting || fetcher.state !== "idle" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  Contabilizar <CalculatorIcon />
                </>
              )}
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
              {rows.length !== 1 ? "extracciones" : "extracción"} por un total
              de <strong>{formatCurrency(totalAmount)}</strong>.
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
      <fetcher.Form>
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      </fetcher.Form>
    </div>
  );
}
