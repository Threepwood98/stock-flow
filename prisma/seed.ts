import { prisma } from "~/lib/prisma";

async function main() {
  console.log("🌱 Starting seed...");

  // Limpiar datos existentes (opcional)
  await prisma.sale.deleteMany();
  await prisma.outflow.deleteMany();
  await prisma.withdraw.deleteMany();
  await prisma.inflow.deleteMany();
  await prisma.product.deleteMany();
  await prisma.code.deleteMany();
  await prisma.company.deleteMany();
  await prisma.area.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.store.deleteMany();

  console.log("✨ Cleaned existing data");

  // 1. Crear Stores
  const store1 = await prisma.store.create({
    data: {
      name: "Tienda Principal",
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: "Sucursal Norte",
    },
  });

  console.log("✅ Created stores");

  // 2. Crear Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      storeId: store1.id,
      name: "Almacén Central",
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      storeId: store2.id,
      name: "Almacén Norte",
    },
  });

  console.log("✅ Created warehouses");

  // 3. Crear Areas
  const area1 = await prisma.area.create({
    data: {
      storeId: store1.id,
      name: "Área de Ventas 1",
    },
  });

  const area2 = await prisma.area.create({
    data: {
      storeId: store1.id,
      name: "Área de Ventas 2",
    },
  });

  const area3 = await prisma.area.create({
    data: {
      storeId: store2.id,
      name: "Área Norte",
    },
  });

  console.log("✅ Created areas");

  // 4. Crear Codes
  const code1 = await prisma.code.create({
    data: {
      id: "ELEC",
      name: "Electrónica",
    },
  });

  const code2 = await prisma.code.create({
    data: {
      id: "HOGAR",
      name: "Hogar",
    },
  });

  const code3 = await prisma.code.create({
    data: {
      id: "ALIM",
      name: "Alimentos",
    },
  });

  console.log("✅ Created codes");

  // 5. Crear Products
  const product1 = await prisma.product.create({
    data: {
      id: "PROD001",
      codeId: code1.id,
      name: 'Laptop HP 15"',
      costPrice: 450.0,
      salePrice: 650.0,
      unit: "unidad",
    },
  });

  const product2 = await prisma.product.create({
    data: {
      id: "PROD002",
      codeId: code1.id,
      name: "Mouse Inalámbrico",
      costPrice: 15.0,
      salePrice: 25.0,
      unit: "unidad",
    },
  });

  const product3 = await prisma.product.create({
    data: {
      id: "PROD003",
      codeId: code2.id,
      name: "Silla Ergonómica",
      costPrice: 120.0,
      salePrice: 180.0,
      unit: "unidad",
    },
  });

  const product4 = await prisma.product.create({
    data: {
      id: "PROD004",
      codeId: code3.id,
      name: "Café Premiunit 500g",
      costPrice: 8.0,
      salePrice: 12.0,
      unit: "paquete",
    },
  });

  console.log("✅ Created products");

  // 6. Crear Companies
  const company1 = await prisma.company.create({
    data: {
      name: "Proveedor Tech SA",
      isProvider: true,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Distribuidora Nacional",
      isProvider: true,
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: "Cliente Corporativo XYZ",
      isProvider: false,
    },
  });

  console.log("✅ Created companies");

  // 7. Crear Inflows
  await prisma.inflow.createMany({
    data: [
      {
        warehouseId: warehouse1.id,
        type: "compra",
        date: new Date("2024-01-15"),
        providerId: company1.id,
        payment: "transferencia",
        inNumber: "IN-001",
        serial: "SER-2024-001",
        productId: product1.id,
        quantity: 10,
        amount: 4500.0,
      },
      {
        warehouseId: warehouse1.id,
        type: "compra",
        date: new Date("2024-01-20"),
        providerId: company1.id,
        payment: "efectivo",
        inNumber: "IN-002",
        serial: "SER-2024-002",
        productId: product2.id,
        quantity: 50,
        amount: 750.0,
      },
      {
        warehouseId: warehouse2.id,
        type: "compra",
        date: new Date("2024-01-25"),
        providerId: company2.id,
        payment: "credito",
        inNumber: "IN-003",
        serial: "SER-2024-003",
        productId: product3.id,
        quantity: 15,
        amount: 1800.0,
      },
    ],
  });

  console.log("✅ Created inflows");

  // 8. Crear Outflows
  await prisma.outflow.createMany({
    data: [
      {
        warehouseId: warehouse1.id,
        type: "traspaso",
        date: new Date("2024-02-01"),
        endAreaId: area1.id,
        outNumber: "OUT-001",
        productId: product1.id,
        quantity: 3,
        amount: 1950.0,
      },
      {
        warehouseId: warehouse1.id,
        type: "traspaso",
        date: new Date("2024-02-05"),
        endAreaId: area2.id,
        outNumber: "OUT-002",
        productId: product2.id,
        quantity: 20,
        amount: 500.0,
      },
      {
        warehouseId: warehouse1.id,
        type: "transferencia",
        date: new Date("2024-02-10"),
        endStoreId: store2.id,
        outNumber: "OUT-003",
        productId: product3.id,
        quantity: 5,
        amount: 900.0,
      },
    ],
  });

  console.log("✅ Created outflows");

  // 9. Crear Withdraws
  await prisma.withdraw.createMany({
    data: [
      {
        areaId: area1.id,
        date: new Date("2024-02-15"),
        amount: 500.0,
      },
      {
        areaId: area2.id,
        date: new Date("2024-02-20"),
        amount: 300.0,
      },
    ],
  });

  console.log("✅ Created withdraws");

  // 10. Crear Sale
  await prisma.sale.createMany({
    data: [
      {
        areaId: area1.id,
        date: new Date("2024-03-01"),
        payment: "efectivo",
        productId: product1.id,
        quantity: 2,
      },
      {
        areaId: area1.id,
        date: new Date("2024-03-02"),
        payment: "tarjeta",
        productId: product2.id,
        quantity: 5,
      },
      {
        areaId: area2.id,
        date: new Date("2024-03-03"),
        payment: "transferencia",
        productId: product2.id,
        quantity: 8,
      },
      {
        areaId: area3.id,
        date: new Date("2024-03-05"),
        payment: "efectivo",
        productId: product4.id,
        quantity: 10,
      },
    ],
  });

  console.log("✅ Created Sale");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
