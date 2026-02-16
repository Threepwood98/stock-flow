import {
  useState,
  type FormEvent,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { toast } from "sonner";
import {
  redirect,
  useFetcher,
  useLoaderData,
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
import { DatePicker } from "~/components/date-picker";
import { SelectList } from "~/components/select-list";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/sale";
import { prisma } from "@/lib/prisma";
import {
  BanIcon,
  CalculatorIcon,
  EraserIcon,
  PinIcon,
  PinOffIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  StoreIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { InputGroup } from "~/components/ui/input-group";
import { Toggle } from "~/components/ui/toggle";

interface SaleRow {
  userId: string;
  salesAreaId: string;
  salesAreaName: string;
  date: string;
  payMethod: string;
  productId: string;
  productName: string;
  quantity: string;
  saleAmount: number;
  costAmount: number;
  stock: number;
}

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
  saleAmount: 0,
  costAmount: 0,
  stock: 0,
};

// Loader Function
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

  const salesAreas = await prisma.salesArea.findMany({
    where: { storeId: { in: storeIds } },
    include: {
      salesAreaInventories: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const parsedSalesAreas = salesAreas.map((sa) => ({
    ...sa,
    salesAreaInventories: sa.salesAreaInventories.map((inv) => ({
      ...inv,
      quantity: inv.quantity.toNumber(),
      minStock: inv.minStock?.toNumber() || 0,
      product: {
        ...inv.product,
        costPrice: inv.product.costPrice.toNumber(),
        salePrice: inv.product.salePrice.toNumber(),
      },
    })),
  }));

  return {
    user,
    salesAreas: parsedSalesAreas,
  };
}

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

  let rows: SaleRow[];
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

      const quantity = parseFloat(row.quantity);
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
              `No hay inventario del producto en el área de venta`,
            );
          }
        }),
      );
    });

    return redirect("/main/sale-area/sale?success=1");
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
export default function Sale() {
  const { user, salesAreas } = useLoaderData<typeof loader>();

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
  const [isDateFixed, setIsDateFixed] = useState(false);
  const [isSalesAreaFixed, setIsSalesAreaFixed] = useState(false);
  const [isPayMethodFixed, setIsPayMethodFixed] = useState(false);

  const availableProducts = useMemo(() => {
    const salesArea = salesAreas.find(
      (sa: any) => sa.id === formValues.salesAreaId,
    );
    if (!salesArea) return [];

    return salesArea.salesAreaInventories
      .filter((inv: any) => inv.quantity > 0)
      .map((inv: any) => ({
        id: inv.product.id,
        name: inv.product.name,
        costPrice: inv.product.costPrice,
        salePrice: inv.product.salePrice,
        unit: inv.product.unit,
        availableQuantity: inv.quantity,
      }));
  }, [formValues.salesAreaId, salesAreas]);

  const fetcher = useFetcher();

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Ventas contabilizadas exitosamente.");
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

  const handleChange = useCallback((name: keyof SaleRow, value: string) => {
    if (name === "salesAreaId") {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
        productId: "",
        productName: "",
        quantity: "",
      }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const calculateAmount = useCallback(
    (
      productId: string,
      quantity: string,
    ): { costAmount: number; saleAmount: number } => {
      const product = availableProducts.find(
        (prod: any) => prod.id === productId,
      );
      const qty = parseFloat(quantity);

      if (!product || isNaN(qty) || qty <= 0) {
        return { costAmount: 0, saleAmount: 0 };
      }

      const costPrice = product.costPrice;
      const salePrice = product.salePrice;
      return { costAmount: qty * costPrice, saleAmount: qty * salePrice };
    },
    [availableProducts],
  );

  const handleAddOrSave = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const quantity = parseFloat(formValues.quantity);

      // Validaciones
      if (quantity <= 0) {
        toast.error("La cantidad debe ser mayor a 0.");
        return;
      }

      if (!formValues.salesAreaId) {
        toast.error("Debe seleccionar un área de venta.");
        return;
      }

      if (!formValues.productId) {
        toast.error("Debe seleccionar un producto.");
        return;
      }

      if (!formValues.payMethod) {
        toast.error("Debe seleccionar un método de pago.");
        return;
      }

      if (!formValues.date) {
        toast.error("Debe seleccionar una fecha.");
        return;
      }

      const product = availableProducts.find(
        (avp: any) => avp.id === formValues.productId,
      );

      if (!product) {
        toast.error("El producto seleccionado no está disponible.");
        return;
      }

      if (quantity > product.availableQuantity) {
        toast.error(
          `Solo hay ${product.availableQuantity} ${product.unit} disponibles.`,
        );
        return;
      }

      const amount = calculateAmount(formValues.productId, formValues.quantity);

      const rowWithAmount: SaleRow = {
        ...formValues,
        costAmount: amount.costAmount,
        saleAmount: amount.saleAmount,
        stock: product.availableQuantity - quantity,
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

      // Preserve locked fields when adding to table
      handleCancel();
    },
    [formValues, availableProducts, calculateAmount, editIndex],
  );

  const handleClean = useCallback(() => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      salesAreaId: isSalesAreaFixed
        ? formValues.salesAreaId
        : salesAreas[0]?.id || "",
      salesAreaName: isSalesAreaFixed
        ? formValues.salesAreaName
        : salesAreas[0]?.name || "",
      date: isDateFixed ? formValues.date : initialFormValues.date,
      payMethod: isPayMethodFixed
        ? formValues.payMethod
        : initialFormValues.payMethod,
    });
  }, [
    user.id,
    salesAreas,
    formValues,
    isDateFixed,
    isSalesAreaFixed,
    isPayMethodFixed,
  ]);

  const handleCancel = useCallback(() => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      salesAreaId: isSalesAreaFixed
        ? formValues.salesAreaId
        : salesAreas[0]?.id || "",
      salesAreaName: isSalesAreaFixed
        ? formValues.salesAreaName
        : salesAreas[0]?.name || "",
      date: isDateFixed ? formValues.date : initialFormValues.date,
      payMethod: isPayMethodFixed
        ? formValues.payMethod
        : initialFormValues.payMethod,
    });
    setEditIndex(null);
  }, [
    user.id,
    salesAreas,
    formValues,
    isDateFixed,
    isSalesAreaFixed,
    isPayMethodFixed,
  ]);

  const handleEdit = useCallback(
    (index: number) => {
      const row = rows[index];
      setFormValues({ ...row });
      setEditIndex(index);
    },
    [rows],
  );

  const handleRemove = useCallback((index: number) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    toast.success("Fila eliminada correctamente.");
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    fetcher.submit({ rows: JSON.stringify(rows) }, { method: "post" });
  }, [rows, fetcher]);

  const totalCostAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (row.costAmount || 0), 0),
    [rows],
  );

  const totalSaleAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (row.saleAmount || 0), 0),
    [rows],
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
    <div className="flex flex-col h-dvh -mt-12 pt-16 pb-4 px-4 gap-2">
      <Card className="p-4">
        <form className="flex flex-col gap-2" onSubmit={handleAddOrSave}>
          <CardHeader className="p-0">
            <CardTitle>Venta</CardTitle>
            <CardAction className="grid grid-cols-2 gap-2">
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
              <Button type="submit" className="min-w-32 cursor-pointer">
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
          </CardHeader>
          <CardContent className="p-0 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            <input
              type="hidden"
              name="userId"
              defaultValue={user.id}
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
                  disabled={isDateFixed}
                  required
                />
                <Toggle
                  pressed={isDateFixed}
                  onPressedChange={setIsDateFixed}
                  title={isDateFixed ? "Soltar" : "Fijar"}
                  className="hover:bg-transparent cursor-pointer data-[state=on]:bg-transparent"
                >
                  {isDateFixed ? <PinOffIcon /> : <PinIcon />}
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
                    options={salesAreas.map((sa: any) => ({
                      value: sa.id,
                      label: sa.name,
                    }))}
                    value={formValues.salesAreaId}
                    onChange={(value) => {
                      const sa = salesAreas.find((s: any) => s.id === value);
                      if (sa) {
                        handleChange("salesAreaId", value);
                        setFormValues((prev) => ({
                          ...prev,
                          salesAreaName: sa.name,
                        }));
                      }
                    }}
                    disable={isSalesAreaFixed}
                    required
                  />
                  <Toggle
                    pressed={isSalesAreaFixed}
                    onPressedChange={setIsSalesAreaFixed}
                    title={isSalesAreaFixed ? "Soltar" : "Fijar"}
                    className="hover:bg-transparent cursor-pointer data-[state=on]:bg-transparent"
                  >
                    {isSalesAreaFixed ? <PinOffIcon /> : <PinIcon />}
                  </Toggle>
                </InputGroup>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="payMethod" className="pl-1">
                Método de Pago
              </Label>
              <InputGroup>
                <SelectList
                  name="payMethod"
                  className="w-full min-w-40"
                  options={payMethods}
                  value={formValues.payMethod}
                  onChange={(value) => handleChange("payMethod", value)}
                  disabled={isPayMethodFixed}
                  required
                />
                <Toggle
                  pressed={isPayMethodFixed}
                  onPressedChange={setIsPayMethodFixed}
                  title={isPayMethodFixed ? "Soltar" : "Fijar"}
                  className="hover:bg-transparent cursor-pointer data-[state=on]:bg-transparent"
                >
                  {isPayMethodFixed ? <PinOffIcon /> : <PinIcon />}
                </Toggle>
              </InputGroup>
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
                options={availableProducts.map((prod: any) => ({
                  value: prod.id,
                  label: `${prod.name} [${prod.availableQuantity} ${prod.unit}]`,
                }))}
                value={formValues.productId}
                renderLabel={(option) => {
                  const match = option.label.match(/^(.+)\[(\d+(\.\d+)?)\s+(\w+)\]$/);
                  if (match) {
                    return (
                      <>
                        {match[1]}
                        <span className="text-muted-foreground">
                          [{match[2]} {match[4]}]
                        </span>
                      </>
                    );
                  }
                  return option.label;
                }}
                onChange={(value) => {
                  const prod = availableProducts.find(
                    (p: any) => p.id === value,
                  );
                  if (prod) {
                    setFormValues((prev) => ({
                      ...prev,
                      productId: prod.id,
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
                onChange={(event) => {
                  const value = event.target.value;
                  const product = availableProducts.find(
                    (p: any) => p.id === formValues.productId,
                  );
                  if (product?.unit === "un") {
                    // Solo permitir números enteros positivos
                    if (value === "" || /^\d+$/.test(value)) {
                      handleChange("quantity", value);
                    }
                  } else {
                    // Permitir números decimales positivos
                    if (value === "" || /^\d*([.,]\d*)?$/.test(value)) {
                      handleChange("quantity", value);
                    }
                  }
                }}
                type="text"
                inputMode={
                  availableProducts.find(
                    (p: any) => p.id === formValues.productId,
                  )?.unit === "un"
                    ? "numeric"
                    : "decimal"
                }
                placeholder={
                  availableProducts.find(
                    (p: any) => p.id === formValues.productId,
                  )?.unit === "un"
                    ? "0"
                    : "0.00"
                }
                className="w-full min-w-0 sm:min-w-40"
                required
              />
            </div>
          </CardContent>
        </form>
      </Card>
      <Card className="flex flex-1 min-h-0 p-4">
        <CardContent className="relative p-0 flex flex-1 overflow-auto min-h-0">
          {editIndex !== null && (
            <div className="absolute inset-0 bg-white/50 cursor-not-allowed z-10 rounded-lg" />
          )}
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 m-auto text-muted-foreground text-center">
              <StoreIcon className="size-32" />
              <p className="font-semibold">
                No hay ventas agregadas. Complete el formulario y haga clic en
                "Agregar".
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Área de Venta</TableHead>
                  <TableHead className="font-semibold">
                    Método de Pago
                  </TableHead>
                  <TableHead className="font-semibold">Producto</TableHead>
                  <TableHead className="text-right font-semibold">
                    Cantidad
                  </TableHead>
                  <TableHead className=" text-right font-semibold">
                    Importe al Costo
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Importe a la Venta
                  </TableHead>
                  <TableHead className="font-semibold">Existencia</TableHead>
                  <TableHead className="font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.salesAreaName}</TableCell>
                    <TableCell>{row.payMethod}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(row.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.costAmount, "cost")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.saleAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.stock.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex">
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
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="text-right font-semibold bg-secondary">
                  <TableCell colSpan={5} className="">
                    TOTAL
                  </TableCell>
                  <TableCell>
                    {formatCurrency(totalCostAmount, "cost")}
                  </TableCell>
                  <TableCell>{formatCurrency(totalSaleAmount)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-end p-0">
          <CardAction>
            <Button
              className="min-w-32"
              disabled={rows.length === 0 || editIndex !== null || isSubmitting}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isSubmitting ? "Procesando..." : "Contabilizar"}{" "}
              <CalculatorIcon />
            </Button>
          </CardAction>
        </CardFooter>
      </Card>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong> venta
              {rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>{formatCurrency(totalCostAmount, "cost")}</strong>.
              <br />
              <br />
              Esta acción registrará las salidas en el sistema de manera
              permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="min-w-32">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Confirmar"
              )}
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
