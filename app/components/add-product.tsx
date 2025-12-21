import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ComboboxPlus, type ComboboxOption } from "./combobox-plus";
import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { SelectList } from "./select-list";
import { AddCategory } from "./add-category";
import { toast } from "sonner";
import type { Category } from "@/types/types";

interface AddPrductProps {
  onClose: (shouldClose: boolean) => void;
  onSuccess: (newOption: ComboboxOption) => void;
  categories: Category[];
  warehouseId?: string;
}

export function AddProduct({
  onClose,
  onSuccess,
  categories: initialCategories = [],
  warehouseId = "",
}: AddPrductProps) {
  const fetcher = useFetcher<{
    success: boolean;
    product?: ComboboxOption;
    error?: string;
  }>();
  const [categoryId, setCategoryId] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.product) {
      hasRun.current = true;
      onSuccess(fetcher.data.product);
    }
  }, [fetcher.data]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
  };

  const handleNewCategory = (newCategory: ComboboxOption) => {
    setCategories((prev) => [
      ...prev,
      {
        id: newCategory.value,
        name: newCategory.label,
      },
    ]);

    toast.success("Categoría agregada y seleccionado exitosamente");
  };

  return (
    <fetcher.Form
      method="post"
      action="/api/add-product"
      className="flex flex-col gap-4"
      onSubmit={handleFormSubmit}
    >
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <DialogHeader>
        <DialogTitle>Agregar Producto</DialogTitle>
        <DialogDescription>
          Complete la información del nuevo producto.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="id" className="pl-1">
            Identificador
          </Label>
          <Input
            id="id"
            name="id"
            placeholder="Ingrese el identificador"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryId" className="pl-1">
            Categoría
          </Label>
          <ComboboxPlus
            name="categoryId"
            options={categories.map((ctg) => ({
              value: ctg.id,
              label: ctg.name,
            }))}
            value={categoryId}
            onChange={(value) => setCategoryId(value)}
            showAddButton
            dialogContent={(props) => <AddCategory {...props} />}
            onDialogSuccess={handleNewCategory}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name" className="pl-1">
          Nombre
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Ingrese el nombre"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="costPrice" className="pl-1">
            Precio Costo
          </Label>
          <Input
            id="costPrice"
            name="costPrice"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="salePrice" className="pl-1">
            Precio Venta
          </Label>
          <Input
            id="salePrice"
            name="salePrice"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit" className="pl-1">
            Unidad de Medida
          </Label>
          <SelectList
            name="unit"
            className="w-full"
            options={[
              { value: "un", label: "Unidad" },
              { value: "kg", label: "Kilogramo" },
              { value: "lt", label: "Litro" },
              { value: "m", label: "Metro" },
            ]}
            value={unit}
            onChange={(value) => setUnit(value)}
            required
          />
        </div>
      </div>
      {fetcher.data?.error && (
        <p className="text-sm text-destructive">{fetcher.data.error}</p>
      )}
      <DialogFooter className="mt-12">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </fetcher.Form>
  );
}
