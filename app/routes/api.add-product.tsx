import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/api.add-product";
import { Decimal } from "@prisma/client/runtime/client";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const id = formData.get("id") as string;
  const categoryId = formData.get("categoryId") as string;
  const warehouseId = formData.get("warehouseId") as string;
  const name = formData.get("name") as string;
  const costPriceStr = formData.get("costPrice") as string;
  const salePriceStr = formData.get("salePrice") as string;
  const unit = formData.get("unit") as string;

  if (
    !id ||
    !categoryId ||
    !warehouseId ||
    !name ||
    !costPriceStr ||
    !salePriceStr ||
    !unit
  ) {
    return {
      success: false,
      error: "Todos los campos son requeridos",
      status: 400,
    };
  }

  const costPrice = new Decimal(costPriceStr);
  const salePrice = new Decimal(salePriceStr);

  if (
    costPrice.isNaN() ||
    salePrice.isNaN() ||
    costPrice.isNegative() ||
    salePrice.isNegative()
  ) {
    return {
      success: false,
      error: "Los precios deben ser números válidos y positivos",
      status: 400,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          id,
          categoryId,
          name,
          costPrice,
          salePrice,
          unit,
        },
      });

      if (warehouseId) {
        await tx.warehouseInventory.create({
          data: {
            warehouseId,
            productId: newProduct.id,
            quantity: 0,
            minStock: 0,
          },
        });
      }

      return newProduct;
    });

    return {
      success: true,
      product: {
        value: result.id,
        label: result.name,
        costPrice: { d: Number(result.costPrice) },
        salePrice: { d: Number(result.salePrice) },
      },
    };
  } catch (error: any) {
    console.error("Error al crear producto:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "Ya existe un producto con ese ID o nombre",
        status: 400,
      };
    }

    if (error.code === "P2003") {
      return {
        success: false,
        error: "El código de categoría no existe",
        status: 400,
      };
    }

    return {
      success: false,
      error: "Error al guardar el producto",
      status: 500,
    };
  }
}
