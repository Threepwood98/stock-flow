import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/api.validate-category";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const id = formData.get("id") as string;

  if (!id) return { ok: false, error: "ID requerido", status: 400 };

  const generalCategoryId = id.split("-").slice(0, 3).join("-");

  const [category, generalCategory] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.generalCategory.findUnique({ where: { id: generalCategoryId } }),
  ]);

  return {
    success: true,
    exists: {
      category: !!category,
      generalCategory: !!generalCategory,
    },
    generalCategoryId,
  };
}
