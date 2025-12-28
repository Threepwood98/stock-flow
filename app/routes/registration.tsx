import { useState } from "react";
import { Form, redirect, useNavigate } from "react-router";
import {
  BadgeCheck,
  CircleCheck,
  Info,
  OctagonAlert,
  Phone,
  Plus,
  ShoppingCartIcon,
  Store,
  Trash2,
  Warehouse,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Progress } from "~/components/ui/progress";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { Route } from "./+types/registration";
import { auth } from "~/lib/auth";
import { prisma } from "~/lib/prisma";

interface Phone {
  number: string;
  isPrimary: boolean;
}

interface Warehouse {
  name: string;
}

interface SalesArea {
  name: string;
}

interface Store {
  name: string;
  warehouses: Warehouse[];
  salesAreas: SalesArea[];
}

// Server Loader
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/signin");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) {
    throw redirect("/signup");
  }

  if (user.profileCompleted) {
    throw redirect("/main");
  }

  return { user };
}

export default function CompleteProfile({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Datos del formulario - sin campos personales extras ya que no están en el schema
  const [phones, setPhones] = useState<Phone[]>([
    { number: "", isPrimary: true },
  ]);

  // SOLO UNA TIENDA - eliminamos el array y usamos un objeto único
  const [store, setStore] = useState<Store>({
    name: "",
    warehouses: [{ name: "" }],
    salesAreas: [{ name: "" }],
  });

  function getInitials(name: string) {
    if (!name) return "";

    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";

    return (first + second).toUpperCase();
  }

  // Funciones para manejar teléfonos
  const addPhone = () => {
    setPhones([...phones, { number: "", isPrimary: false }]);
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, field: keyof Phone, value: any) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], [field]: value };

    // Si se marca como primario, desmarcar los demás
    if (field === "isPrimary" && value === true) {
      newPhones.forEach((phone, i) => {
        if (i !== index) phone.isPrimary = false;
      });
    }

    setPhones(newPhones);
  };

  // Funciones para manejar almacenes
  const addWarehouse = () => {
    setStore({
      ...store,
      warehouses: [...store.warehouses, { name: "" }],
    });
  };

  const removeWarehouse = (index: number) => {
    if (store.warehouses.length > 1) {
      setStore({
        ...store,
        warehouses: store.warehouses.filter((_, i) => i !== index),
      });
    }
  };

  const updateWarehouse = (index: number, value: string) => {
    const newWarehouses = [...store.warehouses];
    newWarehouses[index] = { name: value };
    setStore({ ...store, warehouses: newWarehouses });
  };

  // Funciones para manejar áreas de venta
  const addSalesArea = () => {
    setStore({
      ...store,
      salesAreas: [...store.salesAreas, { name: "" }],
    });
  };

  const removeSalesArea = (index: number) => {
    if (store.salesAreas.length > 1) {
      setStore({
        ...store,
        salesAreas: store.salesAreas.filter((_, i) => i !== index),
      });
    }
  };

  const updateSalesArea = (index: number, value: string) => {
    const newSalesAreas = [...store.salesAreas];
    newSalesAreas[index] = { name: value };
    setStore({ ...store, salesAreas: newSalesAreas });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validaciones
      const validPhones = phones.filter((p) => p.number.trim() !== "");
      if (validPhones.length === 0) {
        throw new Error("Debes agregar al menos un teléfono");
      }

      if (!store.name.trim()) {
        throw new Error("El nombre de la tienda es obligatorio");
      }

      const validWarehouses = store.warehouses.filter(
        (wh) => wh.name.trim() !== ""
      );
      if (validWarehouses.length === 0) {
        throw new Error("Debes agregar al menos un almacén");
      }

      const validSalesAreas = store.salesAreas.filter(
        (sa) => sa.name.trim() !== ""
      );
      if (validSalesAreas.length === 0) {
        throw new Error("Debes agregar al menos un área de venta");
      }

      const response = await fetch("/api/user/complete-profile-extended", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phones: validPhones,
          stores: [
            {
              name: store.name,
              warehouses: validWarehouses,
              salesAreas: validSalesAreas,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al completar el perfil");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al completar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <Avatar className="rounded-full size-20 mx-auto">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <CardTitle>¡Bienvenido, {user.name}!</CardTitle>
          <CardDescription>
            Completa tu información para empezar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              {["Teléfonos", "Tiendas", "Revisión"].map((step, index) => (
                <span
                  key={index}
                  className={`text-sm font-medium ${
                    index + 1 <= currentStep ? "" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
            <Progress value={(currentStep / 3) * 100} />
          </div>
          {error && (
            <Alert className="border-destructive text-destructive bg-destructive/5">
              <OctagonAlert />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {/* Form */}
          <Form
            method="post"
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            {/* Step 1: Teléfonos */}
            {currentStep === 1 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">Teléfonos de Contacto</p>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">{`Teléfono${
                      phones.length > 1 ? "s" : ""
                    }`}</Label>
                    <Button
                      onClick={addPhone}
                      variant="ghost"
                      className="flex items-center gap-2"
                    >
                      Agregar <Plus />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {phones.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="w-full grid gap-2">
                          <Input
                            type="tel"
                            placeholder={`Número de Teléfono ${
                              index === 0 ? "" : index + 1
                            }`}
                            value={phone.number}
                            onChange={(e) =>
                              updatePhone(index, "number", e.target.value)
                            }
                            required
                          />
                          <div className="flex gap-2">
                            <Checkbox
                              id="isPrimary"
                              checked={phone.isPrimary}
                              onCheckedChange={(checked) =>
                                updatePhone(index, "isPrimary", checked)
                              }
                            />
                            <Label htmlFor="terms">Telf. Principal</Label>
                          </div>
                        </div>
                        {phones.length > 1 && (
                          <Button
                            className="cursor-pointer"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
                            title="Eliminar"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Tienda */}
            {currentStep === 2 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">
                  Información de la Tienda
                </p>
                {/* Nombre de la tienda */}
                <div className="grid gap-2">
                  <Label htmlFor="storeName" className="pl-1">
                    Nombre
                  </Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    placeholder="Nombre de la tienda"
                    value={store.name}
                    onChange={(e) =>
                      setStore({ ...store, name: e.target.value })
                    }
                    className="w-full min-w-40"
                    required
                  />
                </div>
                {/* Almacenes */}
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">{`${
                      store.warehouses.length > 1 ? "Almacenes" : "Almacén"
                    }`}</Label>
                    <Button
                      onClick={addWarehouse}
                      variant="ghost"
                      className="flex items-center gap-2"
                    >
                      Agregar <Plus />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {store.warehouses.map((warehouse, whIndex) => (
                      <div key={whIndex} className="flex gap-2">
                        <Input
                          placeholder={`Nombre de Almacén ${
                            whIndex === 0 ? "" : whIndex + 1
                          }`}
                          value={warehouse.name}
                          onChange={(e) =>
                            updateWarehouse(whIndex, e.target.value)
                          }
                          required
                        />
                        {store.warehouses.length > 1 && (
                          <Button
                            className="cursor-pointer"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWarehouse(whIndex)}
                            title="Eliminar"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Áreas de Venta */}
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">{`Área${
                      store.salesAreas.length > 1 ? "s" : ""
                    } de Venta`}</Label>
                    <Button
                      onClick={addSalesArea}
                      variant="ghost"
                      className="flex items-center gap-2"
                    >
                      Agregar <Plus />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {store.salesAreas.map((area, areaIndex) => (
                      <div key={areaIndex} className="flex gap-2">
                        <Input
                          placeholder={`Nombre de Área ${
                            areaIndex === 0 ? "" : areaIndex + 1
                          }`}
                          value={area.name}
                          onChange={(e) =>
                            updateSalesArea(areaIndex, e.target.value)
                          }
                          required
                        />
                        {store.salesAreas.length > 1 && (
                          <Button
                            className="cursor-pointer"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSalesArea(areaIndex)}
                            title="Eliminar"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Alert className="border-blue-600 text-blue-600 bg-blue-50">
                  <Info />
                  <AlertDescription className="text-blue-600">
                    Durante el registro inicial solo puedes agregar una tienda.
                    Si necesitas trabajar con múltiples tiendas, contacta a un
                    administrador después de completar tu registro.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {/* Step 3: Revisión */}
            {currentStep === 3 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">Revisa tu Información</p>
                <div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-5" />{" "}
                    <p className="font-medium">Teléfonos ({phones.length})</p>
                  </div>
                  {phones.map((phone, index) => (
                    <div
                      key={index}
                      className="ml-8 flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <p>{phone.number}</p>{" "}
                      {phone.isPrimary && (
                        <BadgeCheck className="fill-blue-600 text-white size-4" />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="size-5" />{" "}
                    <p className="font-medium">Tienda: {store.name}</p>
                  </div>
                  <div className="ml-8 text-sm">
                    <div className="flex items-center gap-2">
                      <Warehouse className="size-4" /> <p>Almacenes:</p>
                    </div>
                    {store.warehouses.map((wh, i) => (
                      <p key={i} className="ml-8 text-muted-foreground">
                        {wh.name}
                      </p>
                    ))}
                    <div className="flex items-center gap-2">
                      <ShoppingCartIcon className="size-4" />{" "}
                      <p>Áreas de Venta:</p>
                    </div>
                    {store.salesAreas.map((sa, index) => (
                      <p key={index} className="ml-8 text-muted-foreground">
                        {sa.name}
                      </p>
                    ))}
                  </div>
                </div>
                <Alert className="border-green-600 text-green-600 bg-green-50">
                  <CircleCheck />
                  <AlertDescription className="text-green-600">
                    Todo listo! Al completar el registro podrás acceder al
                    sistema y comenzar a trabajar.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Form>
        </CardContent>
        <CardFooter>
          <CardAction className="w-full flex justify-between">
            {currentStep > 1 && (
              <Button
                variant="secondary"
                className="min-w-32"
                onClick={prevStep}
              >
                Atras
              </Button>
            )}
            {currentStep < 3 ? (
              <Button className="ml-auto min-w-32" onClick={nextStep}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto min-w-32"
                disabled={submitting}
              >
                {submitting ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </CardAction>
        </CardFooter>
      </Card>
    </div>
  );
}
