import {
  AudioWaveform,
  BoxesIcon,
  ClipboardListIcon,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  QrCodeIcon,
  ShoppingBagIcon,
  StoreIcon,
  WarehouseIcon,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import { TeamSwitcher } from "~/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { StoreSwitcher } from "./store-switcher";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
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
          icon: BoxesIcon,
          isActive: true,
        },
      ],
    },
    {
      title: "Área de Venta",
      icon: StoreIcon,
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
  ],
};

export function AppSidebar({
  user,
  userStores,
  selectedStoreId,
  onStoreChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: any;
  userStores: any[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
}) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
