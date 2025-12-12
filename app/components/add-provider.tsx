import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ComboboxOption } from "./combobox-plus";
import { useFetcher } from "react-router";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";

interface AddProviderProps {
  onClose: (shouldClose: boolean) => void;
  onSuccess: (newOption: ComboboxOption) => void;
  providerType: "company" | "store";
}

export function AddProvider({
  onClose,
  onSuccess,
  providerType,
}: AddProviderProps) {
  const fetcher = useFetcher<{
    success: boolean;
    provider?: ComboboxOption;
    error?: string;
  }>();

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.provider) {
      onSuccess(fetcher.data.provider);
    }
  }, [fetcher.data]);

  return (
    <fetcher.Form
      method="post"
      action="/api/add-provider"
      className="flex flex-col gap-4"
      onSubmit={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="type" defaultValue={providerType} />
      <DialogHeader>
        <DialogTitle>
          Agregar {providerType === "company" ? "Empresa" : "Tienda"}
        </DialogTitle>
        <DialogDescription>
          Complete la información del nuevo proveedor.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="name">
          Nombre de la {providerType === "company" ? "Empresa" : "Tienda"}
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
  );
}
