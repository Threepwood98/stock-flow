import {
  Dialog,
  DialogClose,
  DialogContent,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: ComboboxOption) => void;
  categories: Category[];
  warehouseId: string;
}

export function AddProduct({
  open = false,
  onOpenChange,
  onSuccess,
  categories: initialCategories = [],
  warehouseId,
}: AddPrductProps) {
  const fetcher = useFetcher<{
    success: boolean;
    product?: ComboboxOption;
    error?: string;
  }>();
  
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryId, setCategoryId] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [addCategoryOpen, setAddCategoryOpen] = useState<boolean>(false);

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.product) {
      toast.success("Producto creado correctamente");
      hasRun.current = true;
      onSuccess(fetcher.data.product);
      onOpenChange(false);
    }
  }, [fetcher.data, onSuccess, onOpenChange]);

  // const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.stopPropagation();
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <fetcher.Form
          method="post"
          action="/api/add-product"
          className="flex flex-col gap-4"
          hidden={addCategoryOpen}
          // onSubmit={handleFormSubmit}
        >
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              Complete la información del nuevo producto.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="warehouseId" value={warehouseId} />
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
                  label: `${ctg.name} (${ctg.generalCategoryId})`,
                }))}
                value={categoryId}
                onChange={setCategoryId}
                showAddButton
                onAddClick={() => setAddCategoryOpen(true)}
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
                onChange={setUnit}
                required
              />
            </div>
          </div>
          {fetcher.data?.error && (
            <p className="text-sm text-destructive">{fetcher.data.error}</p>
          )}
          <DialogFooter>
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
        <AddCategory
          open={addCategoryOpen}
          onOpenChange={setAddCategoryOpen}
          onSuccess={(category) => {
            setCategories((prev) => [
              ...prev,
              {
                id: category.value,
                name: category.label,
                generalCategoryId: category.value
                  .split("-")
                  .slice(0, 3)
                  .join("-"),
              },
            ]);
            setCategoryId(category.value);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
