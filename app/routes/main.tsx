import { Outlet, redirect } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import type { Route } from "./+types/main";
import { auth } from "~/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { prisma } from "~/lib/prisma";
import { useMemo, useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/signin");
  }

  const user = session.user;

  const userStores = await prisma.userStore.findMany({
    where: { userId: user.id },
    include: {
      store: {
        include: {
          warehouses: {
            include: {
              warehouseInventories: {
                include: { product: true },
                orderBy: { product: { name: "asc" } },
              },
            },
            orderBy: { name: "asc" },
          },
          salesAreas: {
            include: {
              salesAreaInventories: {
                include: { product: true },
                orderBy: { product: { name: "asc" } },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
    orderBy: { store: { name: "asc" } },
  });

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  const productsDTO = products.map((p) => ({
    ...p,
    costPrice: p.costPrice.toNumber(),
    salePrice: p.salePrice.toNumber(),
  }));

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const storeIds = userStores.map((us) => us.storeId);

  const sales =
    storeIds.length > 0
      ? await prisma.sale.findMany({
          where: {
            salesArea: { storeId: { in: storeIds } },
          },
          include: {
            product: { include: { category: true } },
            salesArea: { include: { store: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        })
      : [];

  const withdraws =
    storeIds.length > 0
      ? await prisma.withdraw.findMany({
          where: { salesArea: { storeId: { in: storeIds } } },
          include: {
            salesArea: { include: { store: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        })
      : [];

  return {
    user,
    userStores,
    companies,
    products: productsDTO,
    categories,
    sales: sales.map((sale) => ({
      id: sale.id,
      date: sale.date.toISOString().split("T")[0],
      // date: sale.date,
      productId: sale.productId,
      productName: sale.product.name,
      categoryId: sale.product.categoryId,
      categoryName: sale.product.category.name,
      quantity: Number(sale.quantity),
      saleAmount: Number(sale.saleAmount).toFixed(2),
      costAmount: Number(sale.costAmount).toFixed(6),
      // profit: Number(sale.saleAmount) - Number(sale.costAmount),
      payMethod: sale.payMethod,
      salesAreaId: sale.salesAreaId,
      salesAreaName: sale.salesArea.name,
      storeId: sale.salesArea.storeId,
      storeName: sale.salesArea.store.name,
      userId: sale.userId,
      userName: sale.user.name,
    })),
    withdraws: withdraws.map((withdraw) => ({
      id: withdraw.id,
      date: withdraw.date.toISOString().split("T")[0],
      amount: Number(withdraw.amount),
      salesAreaId: withdraw.salesAreaId,
      salesAreaName: withdraw.salesArea.name,
      storeId: withdraw.salesArea.storeId,
      storeName: withdraw.salesArea.store.name,
      userId: withdraw.userId,
      userName: withdraw.user.name,
      createdAt: withdraw.createdAt.toISOString(),
    })),
  };
}

export default function Main({ loaderData }: Route.ComponentProps) {
  const {
    user,
    userStores,
    companies,
    products,
    categories,
    sales,
    withdraws,
  } = loaderData;

  const [selectedStoreId, setSelectedStoreId] = useState(
    userStores[0]?.storeId || ""
  );

  const currrentStore = userStores.find(
    (us) => us.storeId === selectedStoreId
  )?.store;

  const warehouses = currrentStore?.warehouses || [];

  const salesAreas = currrentStore?.salesAreas || [];

  const stores = userStores
    .map((us) => us.store)
    .filter((store) => store.id !== selectedStoreId);

  const providers = { companies, stores };

  const destinations = { stores, salesAreas };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => sale.storeId === selectedStoreId);
  }, [sales, selectedStoreId]);

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((withdraw) => withdraw.storeId === selectedStoreId);
  }, [withdraws, selectedStoreId]);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {userStores.length === 1 && <p>{userStores[0].store.name}</p>}
            {userStores.length > 1 && (
              <Select
                defaultValue={selectedStoreId}
                onValueChange={setSelectedStoreId}
              >
                <SelectTrigger
                  className="w-64"
                  style={{ color: "oklch(0.205 0 0)" }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userStores.map((us) => (
                    <SelectItem key={us.storeId} value={us.storeId}>
                      {us.store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </header>
        <Outlet
          context={{
            user,
            warehouses,
            salesAreas,
            providers,
            destinations,
            products,
            categories,
            sales: filteredSales,
            withdraws: filteredWithdraws,
            userStores,
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
