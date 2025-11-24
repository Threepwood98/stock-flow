import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("registration", "routes/registration.tsx"),

  // Better Auth API routes
  route("api/auth/*", "routes/api.auth.$.tsx"),
  // Rutas protegidas
  route("main", "routes/main.tsx", [
    index("routes/main/dashboard.tsx"),
    route("warehouse/inflow", "routes/main/warehouse/inflow.tsx"),
    route("warehouse/outflow", "routes/main/warehouse/outflow.tsx"),
  ]),
  // 404
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
