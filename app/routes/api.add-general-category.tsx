import { prisma } from "@/lib/prisma";
import type { Route } from "./+types/api.add-general-category";

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
    const generalCategory = await prisma.generalCategory.create({
      data: { id, name },
    });

    return {
      success: true,
      generalCategory: {
        value: generalCategory.id,
        label: generalCategory.name,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Categoría general duplicada",
        status: 400,
      };
    }

    return {
      success: false,
      error: "Error al guardar la categoría general",
      status: 500,
    };
  }
}
