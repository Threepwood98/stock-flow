import { prisma } from "@/lib/prisma";
import type { Route } from "./+types/api.add-category";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  const generalCategoryId = id.split("-").slice(0, 3).join("-");

  if (!id || !name || !generalCategoryId) {
    return {
      success: false,
      error: "Todos los campos son requeridos",
      status: 400,
    };
  }

  try {
    const category = await prisma.category.create({
      data: { id, name, generalCategoryId },
    });

    return {
      success: true,
      category: {
        value: category.id,
        label: category.name,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Categoría duplicada",
        status: 400,
      };
    }

    if (error.code === "P2003") {
      return {
        success: false,
        error: "Categoría general inexistente",
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
