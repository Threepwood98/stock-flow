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
import { prisma } from "~/lib/prisma";
import { auth } from "~/lib/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/signin");
  }

  try {
    const [providers, products, areas] = await Promise.all([
      prisma.company.findMany({
        where: { isProvider: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.salesArea.findMany({
        where: { storeId: "cmi7pmln30000r8w42boh37tb" }, // ⚠️ Considera hacer esto dinámico
        orderBy: { name: "asc" },
      }),
    ]);

    return { session, providers, products, areas };
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Response("Error loading data", { status: 500 });
  }
}

export default function Main({ loaderData }: Route.ComponentProps) {
  const { session, providers, products, areas } = loaderData;
  const user = session.user;

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Outlet context={loaderData} />
      </SidebarInset>
    </SidebarProvider>
  );
}
