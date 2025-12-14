import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/api.get-available-cash";
import { Decimal } from "@prisma/client/runtime/client";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const salesAreaId = url.searchParams.get("salesAreaId");
  const dateStr = url.searchParams.get("date");

  if (!salesAreaId || !dateStr) {
    return { success: false, error: "Faltan parámetros", status: 400 };
  }

  try {
    const date = new Date(dateStr);

    // 1. Total de ventas en efectivo del día
    const cashSalesTotal = await prisma.sale.aggregate({
      where: {
        salesAreaId,
        date,
        payMethod: "EFECTIVO",
      },
      _sum: {
        saleAmount: true,
      },
    });

    const totalCashSales = cashSalesTotal._sum.saleAmount || new Decimal(0);

    // 2. Total de retiros ya registrados del día
    const withdrawsTotal = await prisma.withdraw.aggregate({
      where: {
        salesAreaId,
        date,
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdraws = withdrawsTotal._sum.amount || new Decimal(0);

    // 3. Efectivo disponible
    const availableCash = totalCashSales.minus(totalWithdraws);

    return {
      success: true,
      availableCash: Number(availableCash),
      totalCashSales: Number(totalCashSales),
      totalWithdraws: Number(totalWithdraws),
    };
  } catch (error) {
    console.error("Error al calcular efectivo disponible:", error);
    return {
      success: false,
      error: "Error al calcular efectivo disponible",
      status: 500,
    };
  }
}
