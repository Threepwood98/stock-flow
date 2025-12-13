import { Outlet, redirect } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
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
import { useEffect, useState } from "react";
import { se } from "date-fns/locale";

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

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return { user, userStores, companies, products, categories };
}

export default function Main({ loaderData }: Route.ComponentProps) {
  const { user, userStores, companies, products, categories } = loaderData;

  const [selectedStoreId, setSelectedStoreId] = useState(
    userStores[0]?.storeId || ""
  );

  const currrentStore = userStores.find(
    (us) => us.storeId === selectedStoreId
  )?.store;

  const warehouses = currrentStore?.warehouses || [];

  const salesAreas = currrentStore?.salesAreas || [];

  const warehouseInventories = warehouses.flatMap(
    (wh) => wh.warehouseInventories || []
  );

  const salesAreaInventories = salesAreas.flatMap(
    (sa) => sa.salesAreaInventories || []
  );

  const stores = userStores
    .map((us) => us.store)
    .filter((store) => store.id !== selectedStoreId);

  const providers = { companies, stores };

  const destinations = { stores, salesAreas };

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
            selectedStoreId,
            warehouses,
            salesAreas,
            warehouseInventories,
            salesAreaInventories,
            providers,
            destinations,
            products,
            categories,
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
