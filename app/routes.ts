import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  // Better Auth API routes
  route("api/auth/*", "routes/api.auth.$.tsx"),
  //Rutas protegidas
  route("main", "routes/main.tsx", [
    index("routes/main/dashboard.tsx"),
    route("inflows", "routes/main/inflows.tsx"),
    route("outflows", "routes/main/outflows.tsx"),
  ]),
] satisfies RouteConfig;
