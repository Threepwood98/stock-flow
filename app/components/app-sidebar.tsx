import {
  AudioWaveform,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteIcon,
  Command,
  FileChartPie,
  GalleryVerticalEnd,
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  Receipt,
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
          icon: BanknoteArrowUp,
          isActive: true,
        },
        {
          title: "Caja Extra",
          url: "/main/sale-area/withdraw",
          icon: BanknoteArrowDown,
          isActive: true,
        },
      ],
    },
    {
      title: "Reporte",
      url: "#",
      icon: FileChartPie,
      isActive: true,
      items: [
        {
          title: "Venta",
          url: "/main/report/sales-report",
          icon: BanknoteIcon,
          isActive: true,
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: any }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
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
