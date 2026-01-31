import { useState, type FormEvent, useEffect } from "react";
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
import type { Route } from "./+types/outflow";
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
import type { Destination, OutletContext } from "@/lib/types/types";
import { AddDestination } from "~/components/add-destination";
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
import { LockIcon, LockOpenIcon } from "lucide-react";

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
  saleAmount: number;
  costAmount: number;
}

const outTypeOptions = [
  { value: "TRASLADO", label: "TRASLADO" },
  { value: "VALE", label: "VALE" },
  { value: "VENTA", label: "VENTA" },
  { value: "BAJA", label: "BAJA" },
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

  let rows: OutflowRow[];
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
        }),
      );
    });

    return redirect("/main/warehouse/outflow?success=1");
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
export default function Outflow() {
  const { user, userStores, warehouses, destinations } =
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
    [],
  );
  const [destinationType, setDestinationType] = useState<
    "store" | "salesArea" | "sale"
  >("store");
  const [addDestinationOpen, setAddDestinationOpen] = useState<boolean>(false);
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [isOutTypeLocked, setIsOutTypeLocked] = useState(false);
  const [isDestinationLocked, setIsDestinationLocked] = useState(false);
  const [isProductLocked, setIsProductLocked] = useState(false);
  const [isPayMethodLocked, setIsPayMethodLocked] = useState(false);
  const [isOutNumberLocked, setIsOutNumberLocked] = useState(false);

  const storeIds = userStores.map((us) => us.storeId);

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

  const fetcher = useFetcher();

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
          setDestinationType("store");
          break;
        case "VALE":
          setCurrentDestinations(destinations.salesAreas);
          setDestinationType("salesArea");
          break;
        case "VENTA":
          setCurrentDestinations([]);
          setDestinationType("sale");
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
    quantity: string,
  ): { costAmount: number; saleAmount: number } => {
    const product = availableProducts.find((prod) => prod.id === productId);
    const qty = parseFloat(quantity);

    if (!product || isNaN(qty) || qty <= 0) {
      return { costAmount: 0, saleAmount: 0 };
    }

    const costPrice = product.costPrice;
    const salePrice = product.salePrice;
    return { costAmount: qty * costPrice, saleAmount: qty * salePrice };
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = parseFloat(formValues.quantity);

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }

    if (!formValues.warehouseId) {
      toast.error("Debe seleccionar un almacén.");
      return;
    }

    const product = availableProducts.find(
      (avp) => avp.id === formValues.productId,
    );

    if (product && quantity > product.availableQuantity) {
      toast.error(
        `Solo hay ${product.availableQuantity} ${product.unit} disponibles.`,
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
      warehouseId: warehouses[0]?.id || "",
      warehouseName: warehouses[0]?.name || "",
      date: isDateLocked ? formValues.date : initialFormValues.date,
      outType: isOutTypeLocked ? formValues.outType : initialFormValues.outType,
      destinationId: isDestinationLocked
        ? formValues.destinationId
        : initialFormValues.destinationId,
      destinationName: isDestinationLocked
        ? formValues.destinationName
        : initialFormValues.destinationName,
      payMethod: isPayMethodLocked
        ? formValues.payMethod
        : initialFormValues.payMethod,
      outNumber: isOutNumberLocked
        ? formValues.outNumber
        : initialFormValues.outNumber,
      productId: isProductLocked
        ? formValues.productId
        : initialFormValues.productId,
      productName: isProductLocked
        ? formValues.productName
        : initialFormValues.productName,
    });
    setCurrentDestinations([]);
  };

  const handleCancel = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      warehouseId: warehouses[0]?.id || "",
      warehouseName: warehouses[0]?.name || "",
      date: isDateLocked ? formValues.date : initialFormValues.date,
      outType: isOutTypeLocked ? formValues.outType : initialFormValues.outType,
      destinationId: isDestinationLocked
        ? formValues.destinationId
        : initialFormValues.destinationId,
      destinationName: isDestinationLocked
        ? formValues.destinationName
        : initialFormValues.destinationName,
      payMethod: isPayMethodLocked
        ? formValues.payMethod
        : initialFormValues.payMethod,
      outNumber: isOutNumberLocked
        ? formValues.outNumber
        : initialFormValues.outNumber,
      productId: isProductLocked
        ? formValues.productId
        : initialFormValues.productId,
      productName: isProductLocked
        ? formValues.productName
        : initialFormValues.productName,
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
    fetcher.submit({ rows: JSON.stringify(rows) }, { method: "post" });
  };

  const handleNewDestination = (newDestination: Destination) => {
    const destinationToAdd: Destination = {
      id: newDestination.id,
      name: newDestination.name,
    };

    setCurrentDestinations((prev) => [...prev, destinationToAdd]);

    setFormValues((prev) => ({
      ...prev,
      destinationId: newDestination.id,
      destinationName: newDestination.name,
    }));

    toast.success("Destino agregado y seleccionado exitosamente");
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
          <CardTitle>Salida</CardTitle>
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
              <InputGroup>
                <SelectList
                  name="outType"
                  className="w-full min-w-40"
                  options={outTypeOptions}
                  value={formValues.outType}
                  onChange={(value) => handleChange("outType", value)}
                  disabled={isOutTypeLocked}
                  required
                />
                <Toggle
                  pressed={isOutTypeLocked}
                  onPressedChange={setIsOutTypeLocked}
                  aria-label={
                    isOutTypeLocked
                      ? "Desbloquear tipo de salida"
                      : "Bloquear tipo de salida"
                  }
                  title={
                    isOutTypeLocked
                      ? "Tipo de salida bloqueado"
                      : "Tipo de salida desbloqueado"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isOutTypeLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            {formValues.outType !== "VENTA" && (
              <div className="grid gap-2">
                <Label htmlFor="destination" className="pl-1">
                  Destino
                </Label>
                <InputGroup>
                  <ComboboxPlus
                    name="destination"
                    className="w-full min-w-40"
                    options={currentDestinations.map((dest) => ({
                      value: dest.id,
                      label: dest.name,
                    }))}
                    value={formValues.destinationId}
                    onChange={(value) => {
                      const dest = currentDestinations.find(
                        (d) => d.id === value,
                      );
                      if (dest) {
                        handleChange("destinationId", dest.id);
                        setFormValues((prev) => ({
                          ...prev,
                          destinationName: dest.name,
                        }));
                      }
                    }}
                    showAddButton={formValues.outType !== ""}
                    onAddClick={() => setAddDestinationOpen(true)}
                    disable={isDestinationLocked}
                    required
                  />
                  <Toggle
                    pressed={isDestinationLocked}
                    onPressedChange={setIsDestinationLocked}
                    aria-label={
                      isDestinationLocked
                        ? "Desbloquear destino"
                        : "Bloquear destino"
                    }
                    title={
                      isDestinationLocked
                        ? "Destino bloqueado"
                        : "Destino desbloqueado"
                    }
                    className="hover:bg-transparent data-[state=on]:bg-transparent"
                  >
                    {isDestinationLocked ? <LockOpenIcon /> : <LockIcon />}
                  </Toggle>
                </InputGroup>
              </div>
            )}
            {formValues.outType === "VENTA" && (
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
                    disabled={isPayMethodLocked}
                    required
                  />
                  <Toggle
                    pressed={isPayMethodLocked}
                    onPressedChange={setIsPayMethodLocked}
                    aria-label={
                      isPayMethodLocked
                        ? "Desbloquear método de pago"
                        : "Bloquear método de pago"
                    }
                    title={
                      isPayMethodLocked
                        ? "Método de pago bloqueado"
                        : "Método de pago desbloqueado"
                    }
                    className="hover:bg-transparent data-[state=on]:bg-transparent"
                  >
                    {isPayMethodLocked ? <LockOpenIcon /> : <LockIcon />}
                  </Toggle>
                </InputGroup>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="outNumber" className="pl-1">
                No. de Salida
              </Label>
              <InputGroup>
                <Input
                  id="outNumber"
                  name="outNumber"
                  value={formValues.outNumber}
                  onChange={(event) =>
                    handleChange("outNumber", event.target.value)
                  }
                  disabled={isOutNumberLocked}
                  className="w-full min-w-40"
                  required
                />
                <Toggle
                  pressed={isOutNumberLocked}
                  onPressedChange={setIsOutNumberLocked}
                  aria-label={
                    isOutNumberLocked
                      ? "Desbloquear número de salida"
                      : "Bloquear número de salida"
                  }
                  title={
                    isOutNumberLocked
                      ? "Número de salida bloqueado"
                      : "Número de salida desbloqueado"
                  }
                  className="hover:bg-transparent data-[state=on]:bg-transparent"
                >
                  {isOutNumberLocked ? <LockOpenIcon /> : <LockIcon />}
                </Toggle>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product" className="pl-1">
                Producto
              </Label>
              <InputGroup>
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
              <Label htmlFor="quantity" className="pl-1">
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
                min={0.01}
                step={
                  availableProducts.find((p) => p.id === formValues.productId)
                    ?.unit === "un"
                    ? 1
                    : 0.01
                }
                className="w-full min-w-40"
                required
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
                <TableHead className="font-semibold">Almacén</TableHead>
                <TableHead className="font-semibold">Tipo de Salida</TableHead>
                <TableHead className="font-semibold">Destino</TableHead>
                <TableHead className="font-semibold">Método de Pago</TableHead>
                <TableHead className="text-right font-semibold">
                  No. de Salida
                </TableHead>
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="text-right font-semibold">
                  Cantidad
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe al Costo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Importe a la Venta
                </TableHead>
                <TableHead className="font-semibold">Acciones</TableHead>
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
                      <WarehouseIcon className="size-32" />
                      <p className="font-semibold">
                        No hay salidas agregadas. Complete el formulario y haga
                        clic en "Agregar".
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={index}
                    className={`${index % 2 === 0 ? "bg-secondary" : ""}`}
                  >
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.warehouseName}</TableCell>
                    <TableCell>{row.outType}</TableCell>
                    <TableCell>{row.destinationName || "-"}</TableCell>
                    <TableCell>{row.payMethod || "-"}</TableCell>
                    <TableCell className="text-right">
                      {row.outNumber}
                    </TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell className="text-right">{parseFloat(row.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.costAmount, "cost")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.saleAmount)}
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
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="text-right font-semibold">
                <TableCell colSpan={8}>TOTAL</TableCell>
                <TableCell>{formatCurrency(totalCostAmount, "cost")}</TableCell>
                <TableCell>{formatCurrency(totalSaleAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar contabilización?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de contabilizar <strong>{rows.length}</strong> salida
              {rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>{formatCurrency(totalCostAmount, "cost")}</strong>.
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
      <AddDestination
        open={addDestinationOpen}
        onOpenChange={setAddDestinationOpen}
        onSuccess={handleNewDestination}
        destinationType={destinationType}
        storeId={storeIds[0]}
      />
    </div>
  );
}
