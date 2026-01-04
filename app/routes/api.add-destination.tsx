import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/api.add-destination";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const storeId = formData.get("storeId") as string;

  if (!name?.trim()) {
    return { success: false, error: "El nombre es requerido", status: 400 };
  }

  try {
    let newDestination;

    if (type === "store") {
      newDestination = await prisma.store.create({
        data: { name: name.trim() },
      });
    } else if (type === "salesArea") {
      newDestination = await prisma.salesArea.create({
        data: { name: name.trim(), storeId },
      });
    } else {
      return {
        success: false,
        error: "Tipo de proveedor inválido",
        status: 400,
      };
    }

    return {
      success: true,
      newProvider: {
        id: newDestination.id,
        name: newDestination.name,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Proveedor duplicado",
        status: 400,
      };
    }

    return {
      success: false,
      error: "Error al guardar el proveedor",
      status: 500,
    };
  }
}
