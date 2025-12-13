import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/api.add-category";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  if (!id || !name) {
    return {
      success: false,
      error: "Todos los campos son requeridos",
      status: 400,
    };
  }

  try {
    const newCateggory = await prisma.code.create({ data: { id, name } });

    return {
      success: true,
      category: {
        value: newCateggory.id,
        label: newCateggory.name,
      },
    };
  } catch (error: any) {
    console.error("Error al crear categoría:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "Ya existe una categoría con ese nombre",
        status: 400,
      };
    }

    return {
      success: false,
      error: "Error al guardar la categoría",
      status: 500,
    };
  }
}
