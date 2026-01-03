import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { ComboboxOption } from "./combobox-plus";
import { toast } from "sonner";

interface AddGeneralCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultId: string | null;
}

export function AddGeneralCategory({
  open = false,
  onOpenChange,
  onSuccess,
  defaultId,
}: AddGeneralCategoryProps) {
  if (!defaultId) return null;

  const fetcher = useFetcher<{
    success: boolean;
    generalCategory?: ComboboxOption;
    error?: string;
  }>();

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data?.success && fetcher.data.generalCategory) {
      toast.success("Categoría General creada correctamente");
      hasRun.current = true;
      onSuccess();
      onOpenChange(false);
    }
  }, [fetcher.data, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <fetcher.Form
          method="post"
          action="/api/add-general-category"
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Agregar Categoría General</DialogTitle>
            <DialogDescription>
              Complete la información de la nueva categoría general.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="id" className="pl-1">
              Identificador
            </Label>
            <Input
              id="id"
              name="id"
              defaultValue={defaultId}
              readOnly
              required
            />
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
      </DialogContent>
    </Dialog>
  );
}
