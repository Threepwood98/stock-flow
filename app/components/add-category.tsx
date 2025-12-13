import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type ComboboxOption } from "./combobox-plus";
import { useFetcher } from "react-router";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";

interface AddPrductProps {
  onClose: (shouldClose: boolean) => void;
  onSuccess: (newOption: ComboboxOption) => void;
}

export function AddCategory({ onClose, onSuccess }: AddPrductProps) {
  const fetcher = useFetcher<{
    success: boolean;
    category?: ComboboxOption;
    error?: string;
  }>();

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.category) {
      hasRun.current = true;
      onSuccess(fetcher.data.category);
    }
  }, [fetcher.data]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
  };

  return (
    <fetcher.Form
      method="post"
      action="/api/add-category"
      className="flex flex-col gap-4"
      onSubmit={handleFormSubmit}
    >
      <DialogHeader>
        <DialogTitle>Agregar Categoría</DialogTitle>
        <DialogDescription>
          Complete la información de la nueva categoría.
        </DialogDescription>
      </DialogHeader>
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
