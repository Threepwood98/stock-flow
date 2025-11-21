import { Outlet, useMatches } from "react-router";
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
import { prisma } from "lib/prisma";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    // Considera hacer estas consultas en paralelo
    const [providers, products, areas] = await Promise.all([
      prisma.companies.findMany({
        where: { provider: true },
        orderBy: { name: "asc" },
      }),
      prisma.products.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.areas.findMany({
        where: { store_id: "cmi7pmln30000r8w42boh37tb" }, // ⚠️ Considera hacer esto dinámico
        orderBy: { name: "asc" },
      }),
    ]);

    return { providers, products, areas };
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Response("Error loading data", { status: 500 });
  }
}

export default function Main({ loaderData }: Route.ComponentProps) {
  const matches = useMatches();

  // Genera breadcrumbs dinámicamente basado en la ruta actual
  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      label: match.handle.breadcrumb,
      path: match.pathname,
    }));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.length > 0 ? (
                  breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="contents">
                      <BreadcrumbItem className="hidden md:block">
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.path}>
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </div>
                  ))
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Outlet context={loaderData} />
      </SidebarInset>
    </SidebarProvider>
  );
}
