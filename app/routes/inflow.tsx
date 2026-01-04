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
import { DatePicker } from "~/components/date-picker";
import { SelectList } from "~/components/select-list";
import { ComboboxPlus } from "~/components/combobox-plus";
import type { Route } from "./+types/inflow";
import { prisma } from "~/lib/prisma";
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
import { AddProvider } from "~/components/add-provider";
import { AddProduct } from "~/components/add-product";
import type { OutletContext, Product, Provider } from "@/types/types";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Decimal } from "@prisma/client/runtime/client";

interface InflowRow {
  userId: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  inType: string;
  providerId: string;
  providerName: string;
  invoiceNumber: string;
  inNumber: string;
  productId: string;
  productName: string;
  quantity: string;
  saleAmount: number;
  costAmount: number;
}

const inTypeOptions = [
  { value: "FACTURA", label: "Por Factura" },
  { value: "TRASLADO", label: "Por Traslado" },
];

const initialFormValues: InflowRow = {
  userId: "",
  warehouseId: "",
  warehouseName: "",
  date: format(new Date(), "dd/MM/yyyy"),
  inType: "",
  providerId: "",
  providerName: "",
  invoiceNumber: "",
  inNumber: "",
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
    const data = rows.map((row) => {
      const parsedDate = parse(row.date, "dd/MM/yyyy", new Date());

      if (!isValid(parsedDate)) {
        throw new Error(`Fecha inválida: ${row.date}`);
      }

      const quantity = parseInt(row.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Cantidad inválida: ${row.quantity}`);
      }

      const isFACTURA = row.inType === "FACTURA";

      return {
        userId: row.userId,
        warehouseId: row.warehouseId,
        inType: row.inType,
        date: parsedDate,
        providerCompanyId: isFACTURA ? row.providerId : null,
        providerStoreId: !isFACTURA ? row.providerId : null,
        payMethod: isFACTURA ? "CHEQUE" : null,
        invoiceNumber: isFACTURA ? row.invoiceNumber : null,
        inNumber: row.inNumber,
        productId: row.productId,
        quantity,
        costAmount: new Decimal(row.costAmount ?? 0),
        saleAmount: new Decimal(row.saleAmount ?? 0),
      };
    });

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        data.map(async (entry) => {
          await tx.inflow.create({ data: entry });

          const extingInventory = await tx.warehouseInventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: entry.warehouseId,
                productId: entry.productId,
              },
            },
          });

          if (extingInventory) {
            await tx.warehouseInventory.update({
              where: { id: extingInventory.id },
              data: { quantity: { increment: entry.quantity } },
            });
          } else {
            await tx.warehouseInventory.create({
              data: {
                warehouseId: entry.warehouseId,
                productId: entry.productId,
                quantity: entry.quantity,
                minStock: 0,
              },
            });
          }
        })
      );
    });

    return redirect("/main/warehouse/inflow?success=1");
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
export default function Inflow() {
  const {
    user,
    warehouses,
    providers,
    products: initialProducts,
    categories,
  } = useOutletContext<OutletContext>();

  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<InflowRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<InflowRow>({
    ...initialFormValues,
    userId: user.id,
    warehouseId: warehouses[0]?.id || "",
    warehouseName: warehouses[0]?.name || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([]);
  const [providerType, setProviderType] = useState<"company" | "store">(
    "company"
  );
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [addProductOpen, setAddProductOpen] = useState<boolean>(false);
  const [addProviderOpen, setAddProviderOpen] = useState<boolean>(false);

  const fetcher = useFetcher();

  // Show success notification
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Entradas contabilizadas exitosamente.");
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

    if (name === "inType") {
      switch (value) {
        case "FACTURA":
          setCurrentProviders(providers.companies);
          setProviderType("company");
          break;
        case "TRASLADO":
          setCurrentProviders(providers.stores);
          setProviderType("store");
          break;
      }

      setFormValues((prev) => ({
        ...prev,
        inType: value,
        providerId: "",
        providerName: "",
      }));
    }
  };

  const calculateAmount = (
    productId: string,
    quantity: string
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

    if (!formValues.warehouseId) {
      toast.error("Debe seleccionar un almacén.");
      return;
    }

    if (!formValues.providerId) {
      toast.error("Debe seleccionar un proveedor.");
      return;
    }

    const amount = calculateAmount(formValues.productId, formValues.quantity);

    const rowWithAmount: InflowRow = {
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
    setCurrentProviders([]);
  };

  const handleCancel = () => {
    setFormValues({
      ...initialFormValues,
      userId: user.id,
      warehouseId: warehouses[0]?.id || "",
      warehouseName: warehouses[0]?.name || "",
    });
    setEditIndex(null);
    setCurrentProviders([]);
  };

  const handleEdit = (index: number) => {
    const row = rows[index];
    setFormValues({ ...row });
    setEditIndex(index);

    switch (row.inType) {
      case "FACTURA":
        setCurrentProviders(providers.companies);
        break;
      case "TRASLADO":
        setCurrentProviders(providers.stores);
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

  const handleNewProvider = (newProvider: Provider) => {
    const providerToAdd: Provider = {
      id: newProvider.id,
      name: newProvider.name,
    };

    setCurrentProviders((prev) => [...prev, providerToAdd]);

    setFormValues((prev) => ({
      ...prev,
      providerId: newProvider.id,
      providerName: newProvider.name,
    }));

    toast.success("Proveedor agregado y seleccionado exitosamente");
  };

  const handleNewProduct = (newProduct: Product) => {
    const productToAdd: Product = {
      id: newProduct.id,
      categoryId: newProduct.id,
      name: newProduct.name,
      costPrice: newProduct.costPrice,
      salePrice: newProduct.salePrice,
      unit: newProduct.unit,
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
    0
  );

  const totalSaleAmount = rows.reduce(
    (sum, row) => sum + (row.saleAmount || 0),
    0
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
          <CardTitle>Entrada</CardTitle>
        </CardHeader>
        <form className="flex flex-col gap-4" onSubmit={handleAddOrSave}>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
              <DatePicker
                name="date"
                className="w-full min-w-40"
                value={formValues.date}
                onChange={(value) => {
                  handleChange("date", value);
                  console.log(value);
                }}
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
              <Label htmlFor="type" className="pl-1">
                Tipo de Entrada
              </Label>
              <SelectList
                name="type"
                className="w-full min-w-40"
                options={inTypeOptions}
                value={formValues.inType}
                onChange={(value) => handleChange("inType", value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider" className="pl-1">
                Proveedor
              </Label>
              <ComboboxPlus
                name="provider"
                className="w-full min-w-40"
                options={currentProviders.map((prov) => ({
                  value: prov.id,
                  label: prov.name,
                }))}
                value={formValues.providerId}
                onChange={(value) => {
                  const prov = currentProviders.find((p) => p.id === value);
                  if (prov) {
                    handleChange("providerId", prov.id);
                    setFormValues((prev) => ({
                      ...prev,
                      providerName: prov.name,
                    }));
                  }
                }}
                showAddButton={formValues.inType !== ""}
                onAddClick={() => setAddProviderOpen(true)}
                required
              />
            </div>
            {formValues.inType === "FACTURA" && (
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber" className="pl-1">
                  No. de Factura
                </Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={formValues.invoiceNumber}
                  onChange={(event) =>
                    handleChange("invoiceNumber", event.target.value)
                  }
                  className="w-full min-w-40"
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="inNumber" className="pl-1">
                No. de Entrada
              </Label>
              <Input
                id="inNumber"
                name="inNumber"
                value={formValues.inNumber}
                onChange={(event) =>
                  handleChange("inNumber", event.target.value)
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
                options={products.map((prod) => ({
                  value: prod.id,
                  label: prod.name,
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
                showAddButton
                onAddClick={() => setAddProductOpen(true)}
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
                onChange={(event) =>
                  handleChange("quantity", event.target.value)
                }
                type="number"
                min={1}
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
                <TableHead className="font-semibold">Tipo de Entrada</TableHead>
                <TableHead className="font-semibold">Proveedor</TableHead>
                <TableHead className="text-right font-semibold">
                  No. de Factura
                </TableHead>
                <TableHead className="text-right font-semibold">
                  No. de Entrada
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
                        No hay entradas agregadas. Complete el formulario y haga
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
                    <TableCell>{row.inType}</TableCell>
                    <TableCell>{row.providerName}</TableCell>
                    <TableCell className="text-right">
                      {row.invoiceNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right">{row.inNumber}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
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
              Está a punto de contabilizar <strong>{rows.length}</strong>{" "}
              entrada{rows.length !== 1 ? "s" : ""} por un total de{" "}
              <strong>{formatCurrency(totalCostAmount, "cost")}</strong>.
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
      <fetcher.Form>
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      </fetcher.Form>
      <AddProduct
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onSuccess={handleNewProduct}
        categories={categories}
      />
      <AddProvider
        open={addProviderOpen}
        onOpenChange={setAddProviderOpen}
        onSuccess={handleNewProvider}
        providerType={providerType}
      />
    </div>
  );
}
