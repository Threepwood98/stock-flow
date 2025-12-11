import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("registration", "routes/registration.tsx"),

  // API routes
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/add-provider", "routes/api.add-provider.tsx"),
  route("api/add-product", "routes/api.add-product.tsx"),

  // Rutas protegidas
  route("main", "routes/main.tsx", [
    index("routes/dashboard.tsx"),
    route("warehouse/inflow", "routes/inflow.tsx"),
    route("warehouse/outflow", "routes/outflow.tsx"),
  ]),
  // 404
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
