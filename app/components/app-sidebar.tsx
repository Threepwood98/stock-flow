import {
  BoxesIcon,
  ClipboardListIcon,
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  QrCodeIcon,
  Settings2Icon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  WarehouseIcon,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { StoreSwitcher } from "./store-switcher";
import type { User } from "@/types/types";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Panel",
      url: "/main",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Almacen",
      icon: WarehouseIcon,
      isActive: true,
      items: [
        {
          title: "Entrada",
          url: "/main/warehouse/inflow",
          icon: PackagePlus,
          isActive: true,
        },
        {
          title: "Salida",
          url: "/main/warehouse/outflow",
          icon: PackageMinus,
          isActive: true,
        },
        {
          title: "Inventario",
          url: "/main/warehouse/inventory",
          icon: BoxesIcon,
          isActive: true,
        },
      ],
    },
    {
      title: "Área de Venta",
      icon: ShoppingCartIcon,
      isActive: true,
      items: [
        {
          title: "Venta",
          url: "/main/sale-area/sale",
          icon: ShoppingBagIcon,
          isActive: true,
        },
        {
          title: "Caja Extra",
          url: "/main/sale-area/withdraw",
          icon: QrCodeIcon,
          isActive: true,
        },
        {
          title: "Inventario",
          url: "/main/sale-area/inventory",
          icon: BoxesIcon,
          isActive: true,
        },
      ],
    },
    {
      title: "Reporte",
      url: "#",
      icon: ClipboardListIcon,
      isActive: true,
      items: [
        {
          title: "Desglose del Importe",
          url: "/main/report/sales-amount-report",
          isActive: true,
        },
        {
          title: "Ventas por Categoría",
          url: "/main/report/sales-category-report",
          isActive: true,
        },
      ],
    },
    {
      title: "Administrar",
      url: "#",
      icon: Settings2Icon,
      isActive: true,
    },
  ],
};

export function AppSidebar({
  user,
  userStores,
  selectedStoreId,
  onStoreChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  userStores: any[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
}) {
  const navMain = data.navMain.filter((item) => {
    if (item.title === "Administrar") {
      return user.role === "admin";
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <StoreSwitcher
          userStores={userStores}
          selectedStoreId={selectedStoreId}
          onStoreChange={onStoreChange}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
