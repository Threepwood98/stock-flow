import { useState, useEffect } from "react";
import { Form, redirect } from "react-router";
import { toast } from "sonner";
import {
  BadgeCheck,
  CircleCheck,
  Info,
  Phone,
  Plus,
  ShoppingCartIcon,
  Store,
  Trash2,
  Warehouse,
} from "lucide-react";

import type { Route } from "./+types/complete-profile";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "~/components/ui/input-group";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription } from "~/components/ui/alert";

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

// ============================================
// SERVER LOADER
// ============================================
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw redirect("/signup");
  }

  if (user.profileCompleted) {
    throw redirect("/main");
  }

  return { user };
}

// ============================================
// SERVER ACTION
// ============================================
export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.formData();
  const rawData = formData.get("data");

  if (!rawData) {
    return new Response(
      JSON.stringify({ error: "No hay datos para procesar" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let data: {
    phones: Phone[];
    store: Store;
  };

  try {
    data = JSON.parse(rawData as string);
  } catch {
    return new Response(
      JSON.stringify({ error: "Formato inválido de datos" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validaciones
  const validPhones = data.phones.filter((p) => p.number.trim() !== "");
  if (validPhones.length === 0) {
    return new Response(
      JSON.stringify({ error: "Debes agregar al menos un teléfono" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const invalidPhones = validPhones.filter((p) => p.number.trim().length !== 8);
  if (invalidPhones.length > 0) {
    return new Response(
      JSON.stringify({ error: "Todos los teléfonos deben tener 8 dígitos" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!data.store.name.trim()) {
    return new Response(
      JSON.stringify({ error: "El nombre de la tienda es obligatorio" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validWarehouses = data.store.warehouses.filter(
    (wh) => wh.name.trim() !== ""
  );
  if (validWarehouses.length === 0) {
    return new Response(
      JSON.stringify({ error: "Debes agregar al menos un almacén" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validSalesAreas = data.store.salesAreas.filter(
    (sa) => sa.name.trim() !== ""
  );
  if (validSalesAreas.length === 0) {
    return new Response(
      JSON.stringify({ error: "Debes agregar al menos un área de venta" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar usuario
      await tx.user.update({
        where: { id: session.user.id },
        data: { profileCompleted: true },
      });

      // 2. Eliminar teléfonos existentes y crear nuevos
      await tx.phone.deleteMany({ where: { userId: session.user.id } });

      await Promise.all(
        validPhones.map((phone) =>
          tx.phone.create({
            data: {
              number: phone.number,
              isPrimary: phone.isPrimary,
              userId: session.user.id,
            },
          })
        )
      );

      // 3. Buscar o crear la tienda
      let store = await tx.store.findUnique({
        where: { name: data.store.name },
      });

      if (!store) {
        store = await tx.store.create({
          data: { name: data.store.name },
        });
      }

      // 4. Verificar si la relación usuario-tienda existe
      const existingUserStore = await tx.userStore.findFirst({
        where: {
          userId: session.user.id,
          storeId: store.id,
        },
      });

      if (!existingUserStore) {
        await tx.userStore.create({
          data: {
            userId: session.user.id,
            storeId: store.id,
          },
        });
      }

      // 5. Crear almacenes
      for (const whData of validWarehouses) {
        const existing = await tx.warehouse.findUnique({
          where: {
            name_storeId: {
              name: whData.name,
              storeId: store.id,
            },
          },
        });

        if (!existing) {
          await tx.warehouse.create({
            data: {
              name: whData.name,
              storeId: store.id,
            },
          });
        }
      }

      // 6. Crear áreas de venta
      for (const saData of validSalesAreas) {
        const existing = await tx.salesArea.findUnique({
          where: {
            name_storeId: {
              name: saData.name,
              storeId: store.id,
            },
          },
        });

        if (!existing) {
          await tx.salesArea.create({
            data: {
              name: saData.name,
              storeId: store.id,
            },
          });
        }
      }
    });

    return redirect("/main?success=profile_completed");
  } catch (error: any) {
    console.error("❌ Error al completar perfil:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error al guardar en la base de datos",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ============================================
// COMPONENT
// ============================================
export default function CompleteProfile({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData;

  const [currentStep, setCurrentStep] = useState(1);
  const [phones, setPhones] = useState<Phone[]>([
    { number: "", isPrimary: true },
  ]);
  const [store, setStore] = useState<Store>({
    name: "",
    warehouses: [{ name: "" }],
    salesAreas: [{ name: "" }],
  });

  // Mostrar errores del action
  useEffect(() => {
    if (actionData && "error" in actionData) {
      toast.error(actionData);
    }
  }, [actionData]);

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

  // Validación por paso
  const isStepValid = () => {
    if (currentStep === 1) {
      return phones.every((phone) => phone.number.trim().length === 8);
    }

    if (currentStep === 2) {
      return (
        store.name.trim() !== "" &&
        store.warehouses.every((wh) => wh.name.trim() !== "") &&
        store.salesAreas.every((sa) => sa.name.trim() !== "")
      );
    }

    return true;
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (currentStep !== 3) {
      e.preventDefault();
      return;
    }
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
        <Form
          method="post"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                {["Teléfonos", "Tienda", "Revisión"].map((step, index) => (
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
            {currentStep === 1 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">Teléfonos de Contacto</p>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">
                      Teléfono{phones.length > 1 ? "s" : ""}
                    </Label>
                    <Button
                      type="button"
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
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>+53</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              type="tel"
                              placeholder={`Teléfono ${
                                index === 0 ? "" : index + 1
                              }`}
                              value={phone.number}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 8);
                                updatePhone(index, "number", value);
                              }}
                              maxLength={8}
                            />
                          </InputGroup>
                          {phone.number.length > 0 &&
                            phone.number.length < 8 && (
                              <p className="text-xs text-destructive pl-1">
                                El teléfono debe tener 8 dígitos
                              </p>
                            )}
                          {phones.length > 1 && (
                            <div className="flex gap-2">
                              <Checkbox
                                id={`isPrimary-${index}`}
                                checked={phone.isPrimary}
                                onCheckedChange={(checked) =>
                                  updatePhone(index, "isPrimary", checked)
                                }
                              />
                              <Label htmlFor={`isPrimary-${index}`}>
                                Telf. Principal
                              </Label>
                            </div>
                          )}
                        </div>
                        {phones.length > 1 && (
                          <Button
                            type="button"
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
            {currentStep === 2 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">
                  Información de la Tienda
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="storeName" className="pl-1">
                    Nombre
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="Nombre de la Tienda"
                    value={store.name}
                    onChange={(e) =>
                      setStore({ ...store, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">
                      Almacén{store.warehouses.length > 1 ? "es" : ""}
                    </Label>
                    <Button
                      type="button"
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
                        />
                        {store.warehouses.length > 1 && (
                          <Button
                            type="button"
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
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label className="pl-1">
                      Área{store.salesAreas.length > 1 ? "s" : ""} de Venta
                    </Label>
                    <Button
                      type="button"
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
                        />
                        {store.salesAreas.length > 1 && (
                          <Button
                            type="button"
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
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {currentStep === 3 && (
              <div className="grid gap-4">
                <p className="font-semibold text-xl">Revisa tu Información</p>
                <div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-5" />
                    <p className="font-medium">Teléfonos ({phones.length})</p>
                  </div>
                  {phones.map((phone, index) => (
                    <div
                      key={index}
                      className="ml-8 flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <p>+53 {phone.number}</p>
                      {phone.isPrimary && (
                        <BadgeCheck className="fill-blue-600 text-white size-4" />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="size-5" />
                    <p className="font-medium">Tienda: {store.name}</p>
                  </div>
                  <div className="ml-8 text-sm">
                    <div className="flex items-center gap-2">
                      <Warehouse className="size-4" />
                      <p>Almacenes ({store.warehouses.length}):</p>
                    </div>
                    {store.warehouses.map((wh, i) => (
                      <p key={i} className="ml-8 text-muted-foreground">
                        {wh.name}
                      </p>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <ShoppingCartIcon className="size-4" />
                      <p>Áreas de Venta ({store.salesAreas.length}):</p>
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
                    ¡Todo listo! Al completar el registro podrás acceder al
                    sistema.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <input
            type="hidden"
            name="data"
            value={JSON.stringify({ phones, store })}
          />
          <CardFooter>
            <CardAction className="w-full flex justify-between">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-32"
                  onClick={prevStep}
                >
                  Atrás
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  className="ml-auto min-w-32"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                >
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" className="ml-auto min-w-32">
                  Finalizar
                </Button>
              )}
            </CardAction>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
