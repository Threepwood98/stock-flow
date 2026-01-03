import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("complete-profile", "routes/complete-profile.tsx"),

  // API routes
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/add-provider", "routes/api.add-provider.tsx"),
  route("api/add-product", "routes/api.add-product.tsx"),
  route("api/validate-category", "routes/api.validate-category.tsx"),
  route("api/add-category", "routes/api.add-category.tsx"),
  route("api/add-general-category", "routes/api.add-general-category.tsx"),
  route("api/get-available-cash", "routes/api.get-available-cash.tsx"),

  // Rutas protegidas
  route("main", "routes/main.tsx", [
    index("routes/dashboard.tsx"),
    route("warehouse/inflow", "routes/inflow.tsx"),
    route("warehouse/outflow", "routes/outflow.tsx"),
    route("warehouse/inventory", "routes/warehouse-inventory.tsx"),

    route("sale-area/sale", "routes/sale.tsx"),
    route("sale-area/withdraw", "routes/withdraw.tsx"),
    route("sale-area/inventory", "routes/sales-area-inventory.tsx"),

    route("report/inflows-report", "routes/inflows-report.tsx"),
    route("report/outflows-report", "routes/outflows-report.tsx"),
    route("report/sales-report", "routes/sales-report.tsx"),
    route("report/sales-amount-report", "routes/sales-amount-report.tsx"),
    route("report/sales-category-report", "routes/sales-category-report.tsx"),
  ]),
  // 404
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
