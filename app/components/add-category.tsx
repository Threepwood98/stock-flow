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
import { type ComboboxOption } from "./combobox-plus";
import { useFetcher } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import { AddGeneralCategory } from "./add-general-category";

interface AddCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: ComboboxOption) => void;
}

export function AddCategory({
  open = false,
  onOpenChange,
  onSuccess,
}: AddCategoryProps) {
  const validateFetcher = useFetcher<{
    exists: { category: boolean; generalCategory: boolean };
  }>();

  const createFetcher = useFetcher<{
    success: boolean;
    category?: ComboboxOption;
    error?: string;
  }>();

  const [alertOpen, setAlertOpen] = useState(false);
  const [generalCategoryId, setGeneralCategoryId] = useState<string | null>(
    null
  );
  const [pendingForm, setPendingForm] = useState<FormData | null>(null);
  const [addGeneralOpen, setAddGeneralOpen] = useState(false);

  const isSubmitting =
    validateFetcher.state === "submitting" ||
    createFetcher.state === "submitting";

  const generalId = useMemo(() => {
    if (!pendingForm) return null;
    const id = pendingForm.get("id") as string;
    return id.split("-").slice(0, 3).join("-");
  }, [pendingForm]);

  useEffect(() => {
    if (!open) {
      setPendingForm(null);
      setAlertOpen(false);
      setAddGeneralOpen(false);
    }
  }, [open]);

  const createHasRun = useRef(false);

  useEffect(() => {
    if (!createFetcher.data || createHasRun.current) return;

    if (createFetcher.data?.success && createFetcher.data.category) {
      toast.success("Categoría creada correctamente");
      createHasRun.current = true;
      onSuccess(createFetcher.data.category);
      onOpenChange(false);
    }
  }, [createFetcher.data, onSuccess, onOpenChange]);

  const validateHasRun = useRef(false);

  useEffect(() => {
    if (!validateFetcher.data || validateHasRun.current || !pendingForm) return;

    if (validateFetcher.data.exists.category) {
      toast.error("La categoría ya existe");
      setPendingForm(null);
      return;
    }

    if (!validateFetcher.data.exists.generalCategory) {
      setGeneralCategoryId(generalId);
      setAlertOpen(true);
      return;
    }

    createFetcher.submit(pendingForm, {
      method: "post",
      action: "/api/add-category",
    });
  }, [validateFetcher.data]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    setPendingForm(formData);

    validateFetcher.submit(formData, {
      method: "post",
      action: "/api/validate-category",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <createFetcher.Form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
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
            {createFetcher.data?.error && (
              <p className="text-sm text-destructive">
                {createFetcher.data.error}
              </p>
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
          </createFetcher.Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Categoría general no existe</AlertDialogTitle>
            <AlertDialogDescription>
              La categoría general <b>{generalCategoryId}</b> no existe. ¿Desea
              crearla?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAddGeneralOpen(true)}>
              Crear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddGeneralCategory
        open={addGeneralOpen}
        onOpenChange={setAddGeneralOpen}
        defaultId={generalId}
        onSuccess={() => {
          if (pendingForm) {
            createFetcher.submit(pendingForm, {
              method: "post",
              action: "/api/add-category",
            });
          }
        }}
      />
    </>
  );
}
