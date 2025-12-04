import {
  AudioWaveform,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Command,
  FileChartPie,
  GalleryVerticalEnd,
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  Receipt,
  Store,
  Warehouse,
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
      icon: Warehouse,
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
      url: "#",
      icon: Store,
      items: [
        {
          title: "Venta",
          url: "#",
          icon: BanknoteArrowUp,
        },
        {
          title: "Caja Extra",
          url: "#",
          icon: BanknoteArrowDown,
        },
      ],
    },
    {
      title: "Reporte",
      url: "#",
      icon: FileChartPie,
      items: [
        {
          title: "General",
          url: "#",
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
