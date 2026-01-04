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
import type { ComboboxOption } from "./combobox-plus";
import { useFetcher } from "react-router";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import type { Provider } from "@/lib/types/types";
import { toast } from "sonner";

interface AddProviderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newProvider: Provider) => void;
  providerType: "company" | "store";
}

export function AddProvider({
  open = false,
  onOpenChange,
  onSuccess,
  providerType,
}: AddProviderProps) {
  const fetcher = useFetcher<{
    success: boolean;
    newProvider?: Provider;
    error?: string;
  }>();

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.newProvider) {
      toast.success("Proveedor creado correctamente");
      hasRun.current = true;
      onSuccess(fetcher.data.newProvider);
      onOpenChange(false);
    }
  }, [fetcher.data, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <fetcher.Form
          method="post"
          action="/api/add-provider"
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>
              Agregar {providerType === "company" ? "Empresa" : "Tienda"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del nuevo proveedor.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="type" defaultValue={providerType} />
          <div className="grid gap-2">
            <Label htmlFor="name" className="pl-1">
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
      </DialogContent>
    </Dialog>
  );
}
