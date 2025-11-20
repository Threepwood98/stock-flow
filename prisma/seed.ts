import { prisma } from "lib/prisma";

async function main() {
  console.log('🌱 Starting seed...');

  // Limpiar datos existentes (opcional)
  await prisma.sales.deleteMany();
  await prisma.invoices.deleteMany();
  await prisma.outflows.deleteMany();
  await prisma.withdraws.deleteMany();
  await prisma.inflows.deleteMany();
  await prisma.products.deleteMany();
  await prisma.codes.deleteMany();
  await prisma.companies.deleteMany();
  await prisma.areas.deleteMany();
  await prisma.warehouses.deleteMany();
  await prisma.stores.deleteMany();

  console.log('✨ Cleaned existing data');

  // 1. Crear Stores
  const store1 = await prisma.stores.create({
    data: {
      name: 'Tienda Principal',
    },
  });

  const store2 = await prisma.stores.create({
    data: {
      name: 'Sucursal Norte',
    },
  });

  console.log('✅ Created stores');

  // 2. Crear Warehouses
  const warehouse1 = await prisma.warehouses.create({
    data: {
      store_id: store1.id,
      name: 'Almacén Central',
    },
  });

  const warehouse2 = await prisma.warehouses.create({
    data: {
      store_id: store2.id,
      name: 'Almacén Norte',
    },
  });

  console.log('✅ Created warehouses');

  // 3. Crear Areas
  const area1 = await prisma.areas.create({
    data: {
      store_id: store1.id,
      name: 'Área de Ventas 1',
    },
  });

  const area2 = await prisma.areas.create({
    data: {
      store_id: store1.id,
      name: 'Área de Ventas 2',
    },
  });

  const area3 = await prisma.areas.create({
    data: {
      store_id: store2.id,
      name: 'Área Norte',
    },
  });

  console.log('✅ Created areas');

  // 4. Crear Codes
  const code1 = await prisma.codes.create({
    data: {
      id: 'ELEC',
      name: 'Electrónica',
    },
  });

  const code2 = await prisma.codes.create({
    data: {
      id: 'HOGAR',
      name: 'Hogar',
    },
  });

  const code3 = await prisma.codes.create({
    data: {
      id: 'ALIM',
      name: 'Alimentos',
    },
  });

  console.log('✅ Created codes');

  // 5. Crear Products
  const product1 = await prisma.products.create({
    data: {
      id: 'PROD001',
      code_id: code1.id,
      name: 'Laptop HP 15"',
      cost_price: 450.00,
      sale_price: 650.00,
      um: 'unidad',
    },
  });

  const product2 = await prisma.products.create({
    data: {
      id: 'PROD002',
      code_id: code1.id,
      name: 'Mouse Inalámbrico',
      cost_price: 15.00,
      sale_price: 25.00,
      um: 'unidad',
    },
  });

  const product3 = await prisma.products.create({
    data: {
      id: 'PROD003',
      code_id: code2.id,
      name: 'Silla Ergonómica',
      cost_price: 120.00,
      sale_price: 180.00,
      um: 'unidad',
    },
  });

  const product4 = await prisma.products.create({
    data: {
      id: 'PROD004',
      code_id: code3.id,
      name: 'Café Premium 500g',
      cost_price: 8.00,
      sale_price: 12.00,
      um: 'paquete',
    },
  });

  console.log('✅ Created products');

  // 6. Crear Companies
  const company1 = await prisma.companies.create({
    data: {
      name: 'Proveedor Tech SA',
      provider: true,
    },
  });

  const company2 = await prisma.companies.create({
    data: {
      name: 'Distribuidora Nacional',
      provider: true,
    },
  });

  const company3 = await prisma.companies.create({
    data: {
      name: 'Cliente Corporativo XYZ',
      provider: false,
    },
  });

  console.log('✅ Created companies');

  // 7. Crear Inflows
  await prisma.inflows.createMany({
    data: [
      {
        warehouse_id: warehouse1.id,
        type: 'compra',
        date: new Date('2024-01-15'),
        provider_id: company1.id,
        payment: 'transferencia',
        in_number: 'IN-001',
        serial: 'SER-2024-001',
        product_id: product1.id,
        quantity: 10,
        amount: 4500.00,
      },
      {
        warehouse_id: warehouse1.id,
        type: 'compra',
        date: new Date('2024-01-20'),
        provider_id: company1.id,
        payment: 'efectivo',
        in_number: 'IN-002',
        serial: 'SER-2024-002',
        product_id: product2.id,
        quantity: 50,
        amount: 750.00,
      },
      {
        warehouse_id: warehouse2.id,
        type: 'compra',
        date: new Date('2024-01-25'),
        provider_id: company2.id,
        payment: 'credito',
        in_number: 'IN-003',
        serial: 'SER-2024-003',
        product_id: product3.id,
        quantity: 15,
        amount: 1800.00,
      },
    ],
  });

  console.log('✅ Created inflows');

  // 8. Crear Outflows
  await prisma.outflows.createMany({
    data: [
      {
        warehouse_id: warehouse1.id,
        type: 'traspaso',
        date: new Date('2024-02-01'),
        end_area_id: area1.id,
        out_number: 'OUT-001',
        product_id: product1.id,
        quantity: 3,
        amount: 1950.00,
      },
      {
        warehouse_id: warehouse1.id,
        type: 'traspaso',
        date: new Date('2024-02-05'),
        end_area_id: area2.id,
        out_number: 'OUT-002',
        product_id: product2.id,
        quantity: 20,
        amount: 500.00,
      },
      {
        warehouse_id: warehouse1.id,
        type: 'transferencia',
        date: new Date('2024-02-10'),
        end_store_id: store2.id,
        out_number: 'OUT-003',
        product_id: product3.id,
        quantity: 5,
        amount: 900.00,
      },
    ],
  });

  console.log('✅ Created outflows');

  // 9. Crear Withdraws
  await prisma.withdraws.createMany({
    data: [
      {
        area_id: area1.id,
        date: new Date('2024-02-15'),
        amount: 500.00,
      },
      {
        area_id: area2.id,
        date: new Date('2024-02-20'),
        amount: 300.00,
      },
    ],
  });

  console.log('✅ Created withdraws');

  // 10. Crear Sales
  await prisma.sales.createMany({
    data: [
      {
        area_id: area1.id,
        date: new Date('2024-03-01'),
        payment: 'efectivo',
        product_id: product1.id,
        quantity: 2,
      },
      {
        area_id: area1.id,
        date: new Date('2024-03-02'),
        payment: 'tarjeta',
        product_id: product2.id,
        quantity: 5,
      },
      {
        area_id: area2.id,
        date: new Date('2024-03-03'),
        payment: 'transferencia',
        product_id: product2.id,
        quantity: 8,
      },
      {
        area_id: area3.id,
        date: new Date('2024-03-05'),
        payment: 'efectivo',
        product_id: product4.id,
        quantity: 10,
      },
    ],
  });

  console.log('✅ Created sales');

  // 11. Crear Invoices
  await prisma.invoices.createMany({
    data: [
      {
        warehouse_id: warehouse1.id,
        date: new Date('2024-03-10'),
        payment: 'credito',
        invoice_number: 'INV-2024-001',
        product_id: product1.id,
        quantity: 1,
        company_id: company3.id,
      },
      {
        warehouse_id: warehouse1.id,
        date: new Date('2024-03-12'),
        payment: 'transferencia',
        invoice_number: 'INV-2024-002',
        product_id: product3.id,
        quantity: 3,
        company_id: company3.id,
      },
    ],
  });

  console.log('✅ Created invoices');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });