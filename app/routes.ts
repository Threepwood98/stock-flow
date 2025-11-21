import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("main", "routes/main.tsx", [
    index("routes/main/dashboard.tsx"),
    route("inflows", "routes/main/inflows.tsx"),
    route("outflows", "routes/main/outflows.tsx"),
  ]),
] satisfies RouteConfig;
