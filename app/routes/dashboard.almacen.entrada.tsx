"use client";

import { useState, type FormEvent } from "react";
import {
  IconCalculator,
  IconCancel,
  IconClearAll,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Form, redirect, useOutletContext } from "react-router";
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
import { format, parse } from "date-fns";
import { DatePicker } from "~/components/date-picker";
import { SelectList } from "~/components/select-list";
import { Combobox } from "~/components/combobox";
import type { Route } from "./+types/dashboard.almacen.entrada";
import { prisma } from "lib/prisma";

const options = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

const inTypeOptions = [
  { value: "FACTURA", label: "Por Factura" },
  { value: "TRASLADO", label: "Por Traslado" },
];

const payTypeOptions = [
  { value: "CHEQUE", label: "Por Cheque" },
  { value: "EFECTIVO", label: "Por Efectivo" },
];

const initialFormValues = {
  date: format(new Date(), "dd/MM/yyyy"),
  type: "",
  providerId: "",
  providerName: "",
  payment: "",
  in_number: "",
  serial: "",
  productId: "",
  productName: "",
  quantity: "",
  amount: null,
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawRows = formData.get("rows");

  if (!rawRows) {
    return JSON.stringify({
      error: "No hay datos para insertar.",
      status: 400,
    });
  }
  const rows = JSON.parse(rawRows as string);

  if (!Array.isArray(rows) || rows.length === 0) {
    return JSON.stringify({ error: "Formato inválido de filas.", status: 400 });
  }

  try {
    // Puedes ajustar el warehouse_id según el usuario o la tienda activa
    const warehouse_id = "cmi7pmlnl0002r8w4kedu5n4b";

    // Mapea cada fila del frontend a la estructura Prisma
    const data = rows.map((row: any) => {
      return {
        warehouse_id,
        type: row.type,
        date: parse(row.date, "dd/MM/yyyy", new Date()),
        provider_id: row.providerId,
        payment: row.payment,
        in_number: row.in_number,
        serial: row.serial,
        product_id: row.productId,
        quantity: parseInt(row.quantity),
        amount: Number(row.amount),
      };
    });

    await prisma.$transaction(
      data.map((entry) => prisma.inflows.create({ data: entry }))
    );

    return redirect("/dashboard/almacen/entrada?success=1");
  } catch (error: any) {
    console.error("❌ Error al insertar:", error);
    return JSON.stringify({
      error: "Error al guardar en la base de datos.",
      status: 500,
    });
  }
}

export default function EntradaPage() {
  const { providers, products } = useOutletContext<{
    providers: any[];
    products: any[];
  }>();

  const [rows, setRows] = useState<any[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState(initialFormValues);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const product = products.find((p) => p.id === formValues.productId);
    const quantity = parseInt(formValues.quantity) || 0;
    const amount = product ? quantity * Number(product.sale_price.d) : null;

    const rowWithAmount = { ...formValues, amount };

    if (editIndex !== null) {
      setRows((prev) =>
        prev.map((row, i) => (i === editIndex ? rowWithAmount : row))
      );
    } else {
      setRows((prev) => [...prev, rowWithAmount]);
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
    setFormValues((prev) => ({ ...prev, ...row }));
    setEditIndex(index);
  };

  const handleRemove = (index: number) => {
    setRows((row) => row.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
              value={formValues.providerId}
              onChange={(value) => {
                const prov = providers.find((p) => p.id === value);
                handleChange("providerId", prov!.id);
                handleChange("providerName", prov!.name);
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
              value={formValues.productId}
              onChange={(value) => {
                const prod = products.find((p) => p.id === value);
                handleChange("productId", prod!.id);
                handleChange("productName", prod!.name);
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
      <div className="h-full border rounded-lg relative">
        {(rows.length === 0 || editIndex !== null) && (
          <div className="absolute inset-0 bg-white/50 cursor-not-allowed z-10 rounded-lg" />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo Entrada</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Consecutivo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.providerName}</TableCell>
                <TableCell>{row.payment}</TableCell>
                <TableCell>{row.in_number}</TableCell>
                <TableCell>{row.serial}</TableCell>
                <TableCell>{row.productName}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.amount?.toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    className="cursor-pointer"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(index)}
                  >
                    <IconEdit />
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <IconTrash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Form method="post" className="flex justify-end">
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
        <Button
          type="submit"
          className="min-w-32 cursor-pointer"
          disabled={rows.length === 0 || editIndex !== null}
        >
          Contabilizar <IconCalculator />
        </Button>
      </Form>
    </div>
  );
}
