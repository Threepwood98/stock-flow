"use client";

import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react";
import {
  IconBuildingStore,
  IconBuildingWarehouse,
  IconCashMove,
  IconCashPlus,
  IconPackageExport,
  IconPackageImport,
  IconReceiptDollar,
  IconReport,
} from "@tabler/icons-react";

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
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
      title: "Almacen",
      icon: IconBuildingWarehouse,
      isActive: true,
      items: [
        {
          title: "Entrada",
          url: "dashboard/almacen/entrada",
          icon: IconPackageImport,
          isActive: true,
        },
        {
          title: "Salida",
          url: "#",
          icon: IconPackageExport,
          isActive: true,
        },
        {
          title: "Venta",
          url: "#",
          icon: IconReceiptDollar,
          isActive: true,
        },
      ],
    },
    {
      title: "Área de Venta",
      url: "#",
      icon: IconBuildingStore,
      items: [
        {
          title: "Venta",
          url: "#",
          icon: IconCashPlus,
        },
        {
          title: "Caja Extra",
          url: "#",
          icon: IconCashMove,
        },
      ],
    },
    {
      title: "Reporte",
      url: "#",
      icon: IconReport,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
