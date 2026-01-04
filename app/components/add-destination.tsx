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
import { useFetcher } from "react-router";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import type { Destination } from "~/lib/types/types";
import { toast } from "sonner";

interface AddDestinationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newDestination: Destination) => void;
  destinationType: "store" | "salesArea" | "sale";
  storeId: string;
}

export function AddDestination({
  open = false,
  onOpenChange,
  onSuccess,
  destinationType,
  storeId,
}: AddDestinationProps) {
  if (destinationType === "sale") return null;

  const fetcher = useFetcher<{
    success: boolean;
    newDestination?: Destination;
    error?: string;
  }>();

  const isSubmitting = fetcher.state === "submitting";

  const hasRun = useRef(false);

  useEffect(() => {
    if (!fetcher.data || hasRun.current) return;

    if (fetcher.data.success && fetcher.data.newDestination) {
      toast.success("Destino creado correctamente");
      hasRun.current = true;
      onSuccess(fetcher.data.newDestination);
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
              Agregar {destinationType === "store" ? "Tienda" : "Área de Venta"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del nuevo proveedor.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="type" defaultValue={destinationType} />
          <input type="hidden" name="storeId" defaultValue={storeId} />
          <div className="grid gap-2">
            <Label htmlFor="name" className="pl-1">
              Nombre{" "}
              {destinationType === "store"
                ? "de la Tienda"
                : "del Área de Venta"}
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
