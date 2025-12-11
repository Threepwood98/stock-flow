import { prisma } from "~/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in order due to foreign keys)
  console.log("🧹 Cleaning existing data...");
  await prisma.withdraw.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.outflow.deleteMany();
  await prisma.inflow.deleteMany();
  await prisma.salesAreaInventory.deleteMany();
  await prisma.warehouseInventory.deleteMany();
  await prisma.userStore.deleteMany();
  await prisma.phone.deleteMany();
  await prisma.product.deleteMany();
  await prisma.salesArea.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.code.deleteMany();
  await prisma.company.deleteMany();
  await prisma.store.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // USERS
  // ============================================
  console.log("👤 Creating users...");

  const adminUser = await prisma.user.create({
    data: {
      id: "user_admin_001",
      name: "Admin User",
      email: "admin@example.com",
      emailVerified: true,
      role: "admin",
      profileCompleted: true,
      phones: {
        create: [
          {
            number: "+1234567890",
            isPrimary: true,
          },
        ],
      },
      accounts: {
        create: {
          id: "acc_admin_001",
          accountId: "google_admin",
          providerId: "google",
          password: await hash("Admin123!", 10),
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      id: "user_manager_001",
      name: "Manager User",
      email: "manager@example.com",
      emailVerified: true,
      role: "manager",
      profileCompleted: true,
      phones: {
        create: [
          {
            number: "+1234567891",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      id: "user_regular_001",
      name: "Regular User",
      email: "user@example.com",
      emailVerified: true,
      role: "user",
      profileCompleted: true,
    },
  });

  // ============================================
  // STORES
  // ============================================
  console.log("🏪 Creating stores...");

  const mainStore = await prisma.store.create({
    data: {
      name: "Main Store",
    },
  });

  const downtownStore = await prisma.store.create({
    data: {
      name: "Downtown Branch",
    },
  });

  const northStore = await prisma.store.create({
    data: {
      name: "North Branch",
    },
  });

  // ============================================
  // USER-STORE RELATIONSHIPS
  // ============================================
  console.log("🔗 Linking users to stores...");

  await prisma.userStore.createMany({
    data: [
      { userId: adminUser.id, storeId: mainStore.id },
      { userId: adminUser.id, storeId: downtownStore.id },
      { userId: adminUser.id, storeId: northStore.id },
      { userId: managerUser.id, storeId: mainStore.id },
      { userId: managerUser.id, storeId: downtownStore.id },
      { userId: regularUser.id, storeId: downtownStore.id },
    ],
  });

  // ============================================
  // WAREHOUSES
  // ============================================
  console.log("🏭 Creating warehouses...");

  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: "Main Warehouse",
      storeId: mainStore.id,
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: "Secondary Warehouse",
      storeId: mainStore.id,
    },
  });

  const downtownWarehouse = await prisma.warehouse.create({
    data: {
      name: "Downtown Warehouse",
      storeId: downtownStore.id,
    },
  });

  const northWarehouse = await prisma.warehouse.create({
    data: {
      name: "North Warehouse",
      storeId: northStore.id,
    },
  });

  // ============================================
  // SALES AREAS
  // ============================================
  console.log("🛒 Creating sales areas...");

  const electronicsAreaMain = await prisma.salesArea.create({
    data: {
      name: "Electronics",
      storeId: mainStore.id,
    },
  });

  const clothingAreaMain = await prisma.salesArea.create({
    data: {
      name: "Clothing",
      storeId: mainStore.id,
    },
  });

  const foodAreaMain = await prisma.salesArea.create({
    data: {
      name: "Food & Beverage",
      storeId: mainStore.id,
    },
  });

  const electronicsAreaDowntown = await prisma.salesArea.create({
    data: {
      name: "Electronics",
      storeId: downtownStore.id,
    },
  });

  const homeAreaDowntown = await prisma.salesArea.create({
    data: {
      name: "Home & Garden",
      storeId: downtownStore.id,
    },
  });

  // ============================================
  // COMPANIES
  // ============================================
  console.log("🏢 Creating companies...");

  const techSuppliers = await prisma.company.create({
    data: {
      name: "Tech Suppliers Inc.",
    },
  });

  const fashionWholesale = await prisma.company.create({
    data: {
      name: "Fashion Wholesale Co.",
    },
  });

  const foodDistributors = await prisma.company.create({
    data: {
      name: "Global Food Distributors",
    },
  });

  // ============================================
  // CODES & PRODUCTS
  // ============================================
  console.log("📦 Creating product codes...");

  const codeElectronics = await prisma.code.create({
    data: {
      id: "code_elec_001",
      name: "Electronics",
    },
  });

  const codeClothing = await prisma.code.create({
    data: {
      id: "code_cloth_001",
      name: "Clothing",
    },
  });

  const codeFood = await prisma.code.create({
    data: {
      id: "code_food_001",
      name: "Food",
    },
  });

  console.log("🏷️ Creating products...");

  const laptop = await prisma.product.create({
    data: {
      id: "prod_001",
      codeId: codeElectronics.id,
      name: 'Laptop HP 15"',
      costPrice: 450.0,
      salePrice: 699.99,
      unit: "unit",
    },
  });

  const mouse = await prisma.product.create({
    data: {
      id: "prod_002",
      codeId: codeElectronics.id,
      name: "Wireless Mouse",
      costPrice: 8.5,
      salePrice: 19.99,
      unit: "unit",
    },
  });

  const tshirt = await prisma.product.create({
    data: {
      id: "prod_003",
      codeId: codeClothing.id,
      name: "T-Shirt Cotton Blue",
      costPrice: 5.0,
      salePrice: 14.99,
      unit: "unit",
    },
  });

  const coffee = await prisma.product.create({
    data: {
      id: "prod_004",
      codeId: codeFood.id,
      name: "Coffee Beans 1kg",
      costPrice: 12.0,
      salePrice: 24.99,
      unit: "kg",
    },
  });

  const keyboard = await prisma.product.create({
    data: {
      id: "prod_005",
      codeId: codeElectronics.id,
      name: "Mechanical Keyboard",
      costPrice: 35.0,
      salePrice: 79.99,
      unit: "unit",
    },
  });

  // ============================================
  // INFLOWS
  // ============================================
  console.log("📥 Creating inflows...");

  // Caso 1: Compra desde empresa - Laptops
  await prisma.inflow.create({
    data: {
      userId: adminUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-01-15"),
      inType: "purchase",
      providerCompanyId: techSuppliers.id,
      providerStoreId: null,
      payMethod: "credit",
      invoiceNumber: "INV-2024-001",
      inNumber: "IN-001",
      productId: laptop.id,
      quantity: 50,
      saleAmount: 34999.5,
      costAmount: 22500.0,
    },
  });

  // Caso 2: Compra desde empresa - Mouses
  await prisma.inflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-01-20"),
      inType: "purchase",
      providerCompanyId: techSuppliers.id,
      providerStoreId: null,
      payMethod: "cash",
      invoiceNumber: "INV-2024-002",
      inNumber: "IN-002",
      productId: mouse.id,
      quantity: 200,
      saleAmount: 3998.0,
      costAmount: 1700.0,
    },
  });

  // Caso 3: Compra desde empresa - Keyboards
  await prisma.inflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-01-22"),
      inType: "purchase",
      providerCompanyId: techSuppliers.id,
      providerStoreId: null,
      payMethod: "credit",
      invoiceNumber: "INV-2024-003",
      inNumber: "IN-003",
      productId: keyboard.id,
      quantity: 80,
      saleAmount: 6399.2,
      costAmount: 2800.0,
    },
  });

  // Caso 4: Transferencia desde otra tienda
  await prisma.inflow.create({
    data: {
      userId: regularUser.id,
      warehouseId: downtownWarehouse.id,
      date: new Date("2024-01-25"),
      inType: "transfer",
      providerCompanyId: null,
      providerStoreId: mainStore.id,
      payMethod: null,
      invoiceNumber: null,
      inNumber: "IN-004",
      productId: laptop.id,
      quantity: 10,
      saleAmount: 6999.9,
      costAmount: 4500.0,
    },
  });

  // Caso 5: Compra desde empresa - T-shirts
  await prisma.inflow.create({
    data: {
      userId: adminUser.id,
      warehouseId: secondaryWarehouse.id,
      date: new Date("2024-02-01"),
      inType: "purchase",
      providerCompanyId: fashionWholesale.id,
      providerStoreId: null,
      payMethod: "credit",
      invoiceNumber: "INV-2024-004",
      inNumber: "IN-005",
      productId: tshirt.id,
      quantity: 300,
      saleAmount: 4497.0,
      costAmount: 1500.0,
    },
  });

  // Caso 6: Compra desde empresa - Coffee
  await prisma.inflow.create({
    data: {
      userId: regularUser.id,
      warehouseId: downtownWarehouse.id,
      date: new Date("2024-02-05"),
      inType: "purchase",
      providerCompanyId: foodDistributors.id,
      providerStoreId: null,
      payMethod: "cash",
      invoiceNumber: "INV-2024-005",
      inNumber: "IN-006",
      productId: coffee.id,
      quantity: 100,
      saleAmount: 2499.0,
      costAmount: 1200.0,
    },
  });

  // ============================================
  // WAREHOUSE INVENTORY (Stock inicial)
  // ============================================
  console.log("📦 Creating warehouse inventory...");

  await prisma.warehouseInventory.createMany({
    data: [
      // Main Warehouse
      {
        warehouseId: mainWarehouse.id,
        productId: laptop.id,
        quantity: 40,
        minStock: 10,
      },
      {
        warehouseId: mainWarehouse.id,
        productId: mouse.id,
        quantity: 150,
        minStock: 30,
      },
      {
        warehouseId: mainWarehouse.id,
        productId: keyboard.id,
        quantity: 80,
        minStock: 20,
      },

      // Secondary Warehouse
      {
        warehouseId: secondaryWarehouse.id,
        productId: tshirt.id,
        quantity: 200,
        minStock: 50,
      },

      // Downtown Warehouse
      {
        warehouseId: downtownWarehouse.id,
        productId: laptop.id,
        quantity: 10,
        minStock: 5,
      },
      {
        warehouseId: downtownWarehouse.id,
        productId: coffee.id,
        quantity: 97,
        minStock: 20,
      },

      // North Warehouse
      {
        warehouseId: northWarehouse.id,
        productId: laptop.id,
        quantity: 5,
        minStock: 5,
      },
    ],
  });

  // ============================================
  // OUTFLOWS
  // ============================================
  console.log("📤 Creating outflows...");

  // Caso 1: Transferencia a otra tienda
  await prisma.outflow.create({
    data: {
      userId: adminUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-02-10"),
      outType: "transfer",
      destinationStoreId: northStore.id,
      destinationSalesAreaId: null,
      payMethod: null,
      outNumber: "OUT-001",
      productId: laptop.id,
      quantity: 5,
      saleAmount: 3499.95,
      costAmount: 2250.0,
    },
  });

  // Caso 2: Salida a área de venta - Electronics Main
  await prisma.outflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-02-12"),
      outType: "internal_transfer",
      destinationStoreId: null,
      destinationSalesAreaId: electronicsAreaMain.id,
      payMethod: null,
      outNumber: "OUT-002",
      productId: mouse.id,
      quantity: 50,
      saleAmount: 999.5,
      costAmount: 425.0,
    },
  });

  // Caso 3: Salida a área de venta - Clothing
  await prisma.outflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: secondaryWarehouse.id,
      date: new Date("2024-02-13"),
      outType: "internal_transfer",
      destinationStoreId: null,
      destinationSalesAreaId: clothingAreaMain.id,
      payMethod: null,
      outNumber: "OUT-003",
      productId: tshirt.id,
      quantity: 100,
      saleAmount: 1499.0,
      costAmount: 500.0,
    },
  });

  // Caso 4: Salida a área de venta - Electronics Main (keyboards)
  await prisma.outflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-02-14"),
      outType: "internal_transfer",
      destinationStoreId: null,
      destinationSalesAreaId: electronicsAreaMain.id,
      payMethod: null,
      outNumber: "OUT-004",
      productId: keyboard.id,
      quantity: 30,
      saleAmount: 2399.7,
      costAmount: 1050.0,
    },
  });

  // Caso 5: Devolución a proveedor (sin destino específico)
  await prisma.outflow.create({
    data: {
      userId: adminUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-02-15"),
      outType: "return",
      destinationStoreId: null,
      destinationSalesAreaId: null,
      payMethod: "credit",
      outNumber: "OUT-005",
      productId: laptop.id,
      quantity: 2,
      saleAmount: 1399.98,
      costAmount: 900.0,
    },
  });

  // Caso 6: Producto dañado (sin destino)
  await prisma.outflow.create({
    data: {
      userId: regularUser.id,
      warehouseId: downtownWarehouse.id,
      date: new Date("2024-02-16"),
      outType: "damaged",
      destinationStoreId: null,
      destinationSalesAreaId: null,
      payMethod: null,
      outNumber: "OUT-006",
      productId: coffee.id,
      quantity: 3,
      saleAmount: 74.97,
      costAmount: 36.0,
    },
  });

  // Caso 7: Salida a área de venta - Electronics Downtown
  await prisma.outflow.create({
    data: {
      userId: regularUser.id,
      warehouseId: downtownWarehouse.id,
      date: new Date("2024-02-17"),
      outType: "internal_transfer",
      destinationStoreId: null,
      destinationSalesAreaId: electronicsAreaDowntown.id,
      payMethod: null,
      outNumber: "OUT-007",
      productId: laptop.id,
      quantity: 8,
      saleAmount: 5599.92,
      costAmount: 3600.0,
    },
  });

  // Caso 8: Salida a área de venta - Electronics Main (más laptops)
  await prisma.outflow.create({
    data: {
      userId: managerUser.id,
      warehouseId: mainWarehouse.id,
      date: new Date("2024-02-18"),
      outType: "internal_transfer",
      destinationStoreId: null,
      destinationSalesAreaId: electronicsAreaMain.id,
      payMethod: null,
      outNumber: "OUT-008",
      productId: laptop.id,
      quantity: 3,
      saleAmount: 2099.97,
      costAmount: 1350.0,
    },
  });

  // ============================================
  // SALES AREA INVENTORY (después de outflows)
  // ============================================
  console.log("🛍️ Creating sales area inventory...");

  await prisma.salesAreaInventory.createMany({
    data: [
      // Electronics Main
      {
        salesAreaId: electronicsAreaMain.id,
        productId: mouse.id,
        quantity: 40,
        minStock: 10,
      },
      {
        salesAreaId: electronicsAreaMain.id,
        productId: keyboard.id,
        quantity: 25,
        minStock: 5,
      },
      {
        salesAreaId: electronicsAreaMain.id,
        productId: laptop.id,
        quantity: 1,
        minStock: 2,
      },

      // Clothing Main
      {
        salesAreaId: clothingAreaMain.id,
        productId: tshirt.id,
        quantity: 85,
        minStock: 20,
      },

      // Electronics Downtown
      {
        salesAreaId: electronicsAreaDowntown.id,
        productId: laptop.id,
        quantity: 7,
        minStock: 2,
      },
    ],
  });

  // ============================================
  // SALES
  // ============================================
  console.log("💰 Creating sales...");

  await prisma.sale.createMany({
    data: [
      {
        userId: managerUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-20"),
        payMethod: "credit_card",
        productId: laptop.id,
        quantity: 2,
        saleAmount: 1399.98,
        costAmount: 900.0,
      },
      {
        userId: managerUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-21"),
        payMethod: "cash",
        productId: mouse.id,
        quantity: 10,
        saleAmount: 199.9,
        costAmount: 85.0,
      },
      {
        userId: managerUser.id,
        salesAreaId: clothingAreaMain.id,
        date: new Date("2024-02-22"),
        payMethod: "debit_card",
        productId: tshirt.id,
        quantity: 15,
        saleAmount: 224.85,
        costAmount: 75.0,
      },
      {
        userId: regularUser.id,
        salesAreaId: electronicsAreaDowntown.id,
        date: new Date("2024-02-23"),
        payMethod: "cash",
        productId: laptop.id,
        quantity: 1,
        saleAmount: 699.99,
        costAmount: 450.0,
      },
      {
        userId: managerUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-24"),
        payMethod: "credit_card",
        productId: keyboard.id,
        quantity: 5,
        saleAmount: 399.95,
        costAmount: 175.0,
      },
      {
        userId: managerUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-25"),
        payMethod: "cash",
        productId: mouse.id,
        quantity: 8,
        saleAmount: 159.92,
        costAmount: 68.0,
      },
    ],
  });

  // ============================================
  // WITHDRAWS
  // ============================================
  console.log("💸 Creating withdraws...");

  await prisma.withdraw.createMany({
    data: [
      {
        userId: adminUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-26"),
        amount: 1500.0,
      },
      {
        userId: managerUser.id,
        salesAreaId: clothingAreaMain.id,
        date: new Date("2024-02-27"),
        amount: 500.0,
      },
      {
        userId: regularUser.id,
        salesAreaId: electronicsAreaDowntown.id,
        date: new Date("2024-02-28"),
        amount: 300.0,
      },
    ],
  });

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n✅ Seed completed successfully!");
  console.log("📊 Summary:");
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Stores: ${await prisma.store.count()}`);
  console.log(`   - Warehouses: ${await prisma.warehouse.count()}`);
  console.log(`   - Sales Areas: ${await prisma.salesArea.count()}`);
  console.log(`   - Companies: ${await prisma.company.count()}`);
  console.log(`   - Products: ${await prisma.product.count()}`);
  console.log(`   - Inflows: ${await prisma.inflow.count()}`);
  console.log(`   - Outflows: ${await prisma.outflow.count()}`);
  console.log(`   - Sales: ${await prisma.sale.count()}`);
  console.log(`   - Withdraws: ${await prisma.withdraw.count()}`);

  console.log("\n📦 Inventory:");
  console.log(
    `   - Warehouse Inventory Records: ${await prisma.warehouseInventory.count()}`
  );
  console.log(
    `   - Sales Area Inventory Records: ${await prisma.salesAreaInventory.count()}`
  );

  // Calculate total stock
  const warehouseStock = await prisma.warehouseInventory.aggregate({
    _sum: { quantity: true },
  });
  const salesAreaStock = await prisma.salesAreaInventory.aggregate({
    _sum: { quantity: true },
  });

  console.log(
    `   - Total units in warehouses: ${warehouseStock._sum.quantity || 0}`
  );
  console.log(
    `   - Total units in sales areas: ${salesAreaStock._sum.quantity || 0}`
  );

  console.log("\n📋 Detailed breakdown:");

  // Inflow types
  const inflowFromCompany = await prisma.inflow.count({
    where: { providerCompanyId: { not: null } },
  });
  const inflowFromStore = await prisma.inflow.count({
    where: { providerStoreId: { not: null } },
  });
  console.log(`   - Inflows from companies: ${inflowFromCompany}`);
  console.log(`   - Inflows from stores (transfers): ${inflowFromStore}`);

  // Outflow types
  const outflowToStore = await prisma.outflow.count({
    where: { destinationStoreId: { not: null } },
  });
  const outflowToSalesArea = await prisma.outflow.count({
    where: { destinationSalesAreaId: { not: null } },
  });
  const outflowExternal = await prisma.outflow.count({
    where: {
      AND: [{ destinationStoreId: null }, { destinationSalesAreaId: null }],
    },
  });
  console.log(`   - Outflows to stores: ${outflowToStore}`);
  console.log(`   - Outflows to sales areas: ${outflowToSalesArea}`);
  console.log(`   - Outflows external (returns/damaged): ${outflowExternal}`);

  // Sales by payment method
  const cashSales = await prisma.sale.count({ where: { payMethod: "cash" } });
  const creditSales = await prisma.sale.count({
    where: { payMethod: "credit_card" },
  });
  const debitSales = await prisma.sale.count({
    where: { payMethod: "debit_card" },
  });
  console.log(`   - Cash sales: ${cashSales}`);
  console.log(`   - Credit card sales: ${creditSales}`);
  console.log(`   - Debit card sales: ${debitSales}`);

  // Revenue calculation
  const totalSales = await prisma.sale.aggregate({
    _sum: { saleAmount: true, costAmount: true },
  });
  const revenue = Number(totalSales._sum.saleAmount || 0);
  const cost = Number(totalSales._sum.costAmount || 0);
  const profit = revenue - cost;

  console.log(`\n💰 Financial Summary:`);
  console.log(`   - Total Sales Revenue: $${revenue.toFixed(2)}`);
  console.log(`   - Total Cost: $${cost.toFixed(2)}`);
  console.log(`   - Gross Profit: $${profit.toFixed(2)}`);
  console.log(`   - Profit Margin: ${((profit / revenue) * 100).toFixed(2)}%`);

  // Withdraws summary
  const totalWithdraws = await prisma.withdraw.aggregate({
    _sum: { amount: true },
  });
  console.log(
    `   - Total Withdraws: $${Number(totalWithdraws._sum.amount || 0).toFixed(
      2
    )}`
  );

  // Low stock alerts
  const warehouseInventories = await prisma.warehouseInventory.findMany({
    where: {
      minStock: { not: null },
    },
  });
  const lowStockWarehouse = warehouseInventories.filter(
    (inv) => inv.minStock !== null && inv.quantity <= inv.minStock
  ).length;

  const salesAreaInventories = await prisma.salesAreaInventory.findMany({
    where: {
      minStock: { not: null },
    },
  });
  const lowStockSalesArea = salesAreaInventories.filter(
    (inv) => inv.minStock !== null && inv.quantity <= inv.minStock
  ).length;

  console.log(`\n⚠️  Stock Alerts:`);
  console.log(
    `   - Warehouse products below minimum stock: ${lowStockWarehouse}`
  );
  console.log(
    `   - Sales area products below minimum stock: ${lowStockSalesArea}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
