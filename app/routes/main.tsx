import { Outlet, redirect } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import type { Route } from "./+types/main";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
                include: {
                  product: {
                    include: { category: true },
                  },
                },
                orderBy: { product: { name: "asc" } },
              },
            },
            orderBy: { name: "asc" },
          },
          salesAreas: {
            include: {
              salesAreaInventories: {
                include: {
                  product: {
                    include: { category: true },
                  },
                },
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

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: true },
    }),
    prisma.category.findMany({
      include: {
        generalCategory: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const productsDTO = products.map((p) => ({
    ...p,
    costPrice: p.costPrice.toNumber(),
    salePrice: p.salePrice.toNumber(),
  }));

  const storeIds = userStores.map((us) => us.storeId);

  const [inflows, outflows, sales, withdraws] = await Promise.all([
    storeIds.length > 0
      ? prisma.inflow.findMany({
          where: { userId: user.id, warehouse: { storeId: { in: storeIds } } },
          include: {
            warehouse: true,
            product: true,
            providerCompany: true,
            providerStore: true,
          },
          orderBy: { date: "desc" },
        })
      : [],
    storeIds.length > 0
      ? prisma.outflow.findMany({
          where: { userId: user.id, warehouse: { storeId: { in: storeIds } } },
          include: {
            warehouse: true,
            product: { include: { category: true } },
            destinationStore: true,
            destinationSalesArea: true,
          },
          orderBy: { date: "desc" },
        })
      : [],
    storeIds.length > 0
      ? prisma.sale.findMany({
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
      : [],
    storeIds.length > 0
      ? prisma.withdraw.findMany({
          where: { salesArea: { storeId: { in: storeIds } } },
          include: {
            salesArea: { include: { store: true } },
            user: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        })
      : [],
  ]);

  return {
    user,
    userStores: userStores.map((userStore) => ({
      ...userStore,
      store: {
        ...userStore.store,
        warehouses: userStore.store.warehouses.map((wh) => ({
          ...wh,
          warehouseInventories: wh.warehouseInventories.map((inv) => ({
            ...inv,
            quantity: inv.quantity.toNumber(),
            minStock: inv.minStock?.toNumber() || 0,
            product: {
              ...inv.product,
              costPrice: inv.product.costPrice.toNumber(),
              salePrice: inv.product.salePrice.toNumber(),
            },
          })),
        })),
        salesAreas: userStore.store.salesAreas.map((sa) => ({
          ...sa,
          salesAreaInventories: sa.salesAreaInventories.map((inv) => ({
            ...inv,
            quantity: inv.quantity.toNumber(),
            minStock: inv.minStock?.toNumber() || 0,
            product: {
              ...inv.product,
              costPrice: inv.product.costPrice.toNumber(),
              salePrice: inv.product.salePrice.toNumber(),
            },
          })),
        })),
      },
    })),
    companies,
    products: productsDTO,
    categories,
    inflows: inflows.map((inflow) => ({
      ...inflow,
      warehouseName: inflow.warehouse.name,
      date: inflow.date.toISOString().split("T")[0],
      providerName: inflow.providerCompany?.name ?? inflow.providerStore?.name,
      productName: inflow.product.name,
      quantity: inflow.quantity.toNumber(),
      costAmount: inflow.costAmount.toNumber(),
      saleAmount: inflow.saleAmount.toNumber(),
    })),
    outflows: outflows.map((outflow) => ({
      ...outflow,
      warehouseName: outflow.warehouse.name,
      date: outflow.date.toISOString().split("T")[0],
      destinationName:
        outflow.destinationStore?.name ?? outflow.destinationSalesArea?.name,
      productName: outflow.product.name,
      categoryId: outflow.product.categoryId,
      categoryName: outflow.product.category.name,
      quantity: outflow.quantity.toNumber(),
      costAmount: outflow.costAmount.toNumber(),
      saleAmount: outflow.saleAmount.toNumber(),
    })),
    sales: sales.map((sale) => ({
      ...sale,
      date: sale.date.toISOString().split("T")[0],
      productName: sale.product.name,
      categoryId: sale.product.categoryId,
      categoryName: sale.product.category.name,
      quantity: sale.quantity.toNumber(),
      saleAmount: sale.saleAmount.toNumber(),
      costAmount: sale.costAmount.toNumber(),
      salesAreaName: sale.salesArea.name,
      storeId: sale.salesArea.storeId,
      storeName: sale.salesArea.store.name,
      userName: sale.user.name,
    })),
    withdraws: withdraws.map((withdraw) => ({
      ...withdraw,
      date: withdraw.date.toISOString().split("T")[0],
      amount: Number(withdraw.amount),
      salesAreaName: withdraw.salesArea.name,
      storeId: withdraw.salesArea.storeId,
      storeName: withdraw.salesArea.store.name,
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
    inflows,
    outflows,
    sales,
    withdraws,
  } = loaderData;

  const [selectedStoreId, setSelectedStoreId] = useState(
    userStores[0]?.storeId || "",
  );

  const currrentStore = userStores.find(
    (us) => us.storeId === selectedStoreId,
  )?.store;

  const warehouses = currrentStore?.warehouses || [];

  const salesAreas = currrentStore?.salesAreas || [];

  const stores = userStores
    .map((us) => us.store)
    .filter((store) => store.id !== selectedStoreId);

  const providers = { companies, stores };

  const destinations = { stores, salesAreas };

  const filteredInflows = useMemo(() => {
    return inflows.filter(
      (inflow) => inflow.warehouse.storeId === selectedStoreId,
    );
  }, [inflows, selectedStoreId]);

  const filteredOutflows = useMemo(() => {
    return outflows.filter(
      (outflow) => outflow.warehouse.storeId === selectedStoreId,
    );
  }, [outflows, selectedStoreId]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => sale.storeId === selectedStoreId);
  }, [sales, selectedStoreId]);

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((withdraw) => withdraw.storeId === selectedStoreId);
  }, [withdraws, selectedStoreId]);

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        userStores={userStores}
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-50 bg-background">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
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
            inflows: filteredInflows,
            outflows: filteredOutflows,
            sales: filteredSales,
            withdraws: filteredWithdraws,
            userStores,
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
