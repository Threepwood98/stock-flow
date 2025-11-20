import type { Route } from "./+types/_index";
import DashboardPage from "./dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <DashboardPage />;
}
