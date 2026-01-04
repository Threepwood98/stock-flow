import { parseISO } from "date-fns";
import { prisma } from "@/lib/prisma";

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
  await prisma.category.deleteMany();
  await prisma.generalCategory.deleteMany();
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
      id: "bpl74N816wHTZbKhGdWwXk25WkWGEkTZ",
      name: "Karel David Delgado Alonso",
      email: "kdelgadoalonso@gmail.com",
      emailVerified: true,
      image:
        "https://lh3.googleusercontent.com/a/ACg8ocJKlP3w_f861L9KJsyf5xVBKs4LsWGCkbWCkd95IHPAOe0y1g=s96-c",
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
          id: "2EczJM1PlAjtUcCS19Cj5BEEtest2jes",
          accountId: "113550373324311232024",
          providerId: "google",
          accessToken:
            "ya29.A0Aa7pCA_H8Hd0IOr6I1cIIM9Sf4hTmQ1RjeFJ_3ACdvQbuRRNinHMDNQtUEdOkG-m4ZSilKdy3XWptP0EZQrBvNZtM4WiLjY8FwSaH8kUBkbE5nV-7LQUVg5JsyCKQE52Jp7wvoIogNASUl7sEnY7an6uq2XzoRN93RhePmgMTDaQ2eRGo_9541DF2V6ilJdnLVxWf89ucxpe9fIq0Hzp0XgWhSeZkLKw8F25okjvkesECGO1oqJGqGhC1_ExayinXD3iFX7tKEHwh2h35HrAgDUrEtVOaCgYKAcoSARYSFQHGX2Mi2zCIrE2KjOZR0eSC7aKzkw0291",
          idToken:
            "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEzMGZkY2VmY2M4ZWQ3YmU2YmVkZmE2ZmM4Nzk3MjIwNDBjOTJiMzgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI2NDY0MzAxNDUxNzItanY5YW50a2toNW81djh1ZGVtZ2pqNHRsN2FxazJqczguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2NDY0MzAxNDUxNzItanY5YW50a2toNW81djh1ZGVtZ2pqNHRsN2FxazJqczguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM1NTAzNzMzMjQzMTEyMzIwMjQiLCJlbWFpbCI6ImtkZWxnYWRvYWxvbnNvQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiSk9HZTJmalh0ODROMHIxZWRTQjM3QSIsIm5hbWUiOiJLYXJlbCBEYXZpZCBEZWxnYWRvIEFsb25zbyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKS2xQM3dfZjg2MUw5S0pzeWY1eFZCS3M0THNXR0NrYldDa2Q5NUlIUEFPZTB5MWc9czk2LWMiLCJnaXZlbl9uYW1lIjoiS2FyZWwgRGF2aWQiLCJmYW1pbHlfbmFtZSI6IkRlbGdhZG8gQWxvbnNvIiwiaWF0IjoxNzY1Njc3MDU5LCJleHAiOjE3NjU2ODA2NTl9.LopQQ5fB_U6SBhx69SubKdFwaODWDEy2bC3wI2H6HyqiNOVQaGjHZyeZSEkn7V1zDnG4UMjhJlK-eN23Uqg9XSy069vDfUNHEqCKQD0R-krX62jEEuv-TrWMZ53Q1EXHgogyoKHUxjmRyrtlHRcq8iM7eh7-JSHPjcVxCdlbMAn4V6MAGmNzFiSGCZO2UYN8-NGPjKvBANETU5yyaGznu3C0Zk9fMdzcsA2wgHtaIokM--o_FfSRcJlNhn5XrR3DgfQQBstBn1bYf0WddvHdNy-mEGXotjvdnk0Zg4yr-3b3CX7mQl4_MGi22hcEFMdXZ_Nlu3mT1pT4ef5IxAkTig",
          accessTokenExpiresAt: parseISO("2025-12-14 02:51:01.196"),
          scope:
            "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
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
    data: { name: "Main Store" },
  });

  const downtownStore = await prisma.store.create({
    data: { name: "Downtown Branch" },
  });

  const northStore = await prisma.store.create({
    data: { name: "North Branch" },
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
    data: { name: "Main Warehouse", storeId: mainStore.id },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: { name: "Secondary Warehouse", storeId: mainStore.id },
  });

  const downtownWarehouse = await prisma.warehouse.create({
    data: { name: "Downtown Warehouse", storeId: downtownStore.id },
  });

  const northWarehouse = await prisma.warehouse.create({
    data: { name: "North Warehouse", storeId: northStore.id },
  });

  // ============================================
  // SALES AREAS
  // ============================================
  console.log("🛒 Creating sales areas...");

  const electronicsAreaMain = await prisma.salesArea.create({
    data: { name: "Electronics", storeId: mainStore.id },
  });

  const clothingAreaMain = await prisma.salesArea.create({
    data: { name: "Clothing", storeId: mainStore.id },
  });

  const foodAreaMain = await prisma.salesArea.create({
    data: { name: "Food & Beverage", storeId: mainStore.id },
  });

  const electronicsAreaDowntown = await prisma.salesArea.create({
    data: { name: "Electronics", storeId: downtownStore.id },
  });

  const homeAreaDowntown = await prisma.salesArea.create({
    data: { name: "Home & Garden", storeId: downtownStore.id },
  });

  // ============================================
  // COMPANIES
  // ============================================
  console.log("🏢 Creating companies...");

  const companiesData = [
    "MI Canastilla",
    "Universal",
    "Fenix",
    "Textilera Desembarco del Granma",
    "Labiofam",
    "Gases Industriales",
    "Emp. Calzado",
    "Geominera",
    "MI Eden",
    "MI Ultra",
    "MI La Francia",
    "MI La Perla",
    "UEB Villa Clara Muebles",
    "EES Emp. Indust. Equipo y Serv.",
    "EES Emp. Prov. Serv. Tecn. Pers. y del Hogar",
    "MI El Canes",
    "Emp. Prov. Artes Gráficas",
    "MI Yabu",
    "MI El Arco",
    "MI Viveres 8 de octubre",
    "MI Los Bebitos",
    "Emp. Electroquímica de Sagua",
    "MI La Campana",
    "Emp. Aseguramiento al Comercio",
    "MI El Cohete",
    "MI Comercial Condado",
    "Emp. Const. Obras de Arquitectura",
    "MI Gomera",
    "MI El Constructor",
    "Emp. Marmoles del Centro",
    "EES EIESA UEB Villa Clara",
    "Emp. Prov. Producciones Varias",
    "Emp. Vidrios Lisa",
    "El Dorado",
    "MI Estrella Roja",
    "UEB Gases Villa Clara",
    "MI Escambray",
    "MI El Triunfo",
    "COPEXTEL",
    "Manajanabo",
    "Emp. Comercio",
    "Minerva",
    "MI Amanecer",
    "MI Caracatey",
    "1ro Mayo",
    "Dorado",
    "Geominera Holguin",
    "MI Hatillo",
    "Emp. Prov. Conf. CALCONF",
    "America Latina",
    "MI Capiro",
    "Emp. Comercial Cemento UEB VC",
    "Emp. Prov. de Plastico Artificios Pirotecnicos y Textiles",
    "MI Comercial Sagua",
    "MI Moderna",
    "Empresa Recuperacion de Materias Primas",
    "Encomil",
    "Zoraida Aguilera Barreras",
    "COMBELL",
    "UEB Calzado Jose Luis Chaviano",
    "Hospital Psiquiatrico",
    "Fondo Cubano de Bienes Culturales",
    "Emp. Carpinteria de Aluminio Villalco",
    "Almacen de la Empresa",
    "Apertura del Sistema",
    "Calconf",
    "MI Sierra Maestra",
    "MI 12 Plantas",
    "MI El Caney",
    "Ernesto Martin Mondeja",
    "La Aurora",
    "EMCOPLAST SURL IRCC",
    "CABELLOS SOCIEDAD UNIPERSONAL",
    "MI Guama",
    "Taller de REfrigeracion",
    "Oferta y Demanda",
    "Servicio",
    "UEB Cocina Centralizada",
    "UEB 3",
    "Dir. Mcpal. Trabajo y Seguridad Social",
    "Inder",
    "Centro de Elaboracion Vigia",
    "Aojamiento Las Tecas",
    "UB 3",
    "MI El Taladro",
    "MI America Latina",
    "SURL Construcciones T-R",
    "Hospital Arnaldo Millian Castro",
    "Casita infantil Amiguitos del Comercio",
    "CPT Alexei Arteaga",
    "MI de Viveres Mi Casa",
    "Empresa Comercio y Gast. Sagua la G",
    "UAAAI Dep. Ad. Prov. VC",
    "Emp. Mtto. a Grupos Electrogenos",
    "Escuela de economia",
    "Frutas Selectas",
    "Villaplast",
    "Empresa de Correos",
  ];

  await prisma.company.createMany({
    data: companiesData.map((name) => ({ name })),
  });

  console.log(`   ✓ Created ${companiesData.length} companies`);

  // Obtener empresas
  const miCanastilla = await prisma.company.findFirst({
    where: { name: "MI Canastilla" },
  });
  const textilera = await prisma.company.findFirst({
    where: { name: "Textilera Desembarco del Granma" },
  });
  const empCalzado = await prisma.company.findFirst({
    where: { name: "Emp. Calzado" },
  });

  // ============================================
  // GENERAL CATEGORIES (Nivel 1)
  // ============================================
  console.log("📂 Creating general categories...");

  const generalCategoriesData = [
    {
      id: "189-30-301",
      name: "Industriales normados y Plan Especial",
      description: "Productos industriales normados y del plan especial",
    },
    {
      id: "189-30-302",
      name: "Produccion Nacional",
      description: "Productos de producción nacional",
    },
    {
      id: "189-30-303",
      name: "Importadas",
      description: "Productos importados",
    },
    {
      id: "189-30-304",
      name: "Produccion Local",
      description: "Productos de producción local",
    },
    {
      id: "189-30-305",
      name: "Materiales de la Construccion Nacional",
      description: "Materiales de construcción nacionales",
    },
    {
      id: "189-30-306",
      name: "Materiales de la Construccion Local",
      description: "Materiales de construcción locales",
    },
    {
      id: "189-30-309",
      name: "Aseo Nacional/Local",
      description: "Productos de aseo nacional y local",
    },
  ];

  await prisma.generalCategory.createMany({
    data: generalCategoriesData,
  });

  console.log(
    `   ✓ Created ${generalCategoriesData.length} general categories`
  );

  // ============================================
  // CATEGORIES (Nivel 2 - Específicas)
  // ============================================
  console.log("📦 Creating categories...");

  const categoriesData = [
    {
      id: "189-30-301-31",
      generalCategoryId: "189-30-301",
      name: "Industriales normados",
      description: "Uniformes y productos industriales normados",
    },
    {
      id: "189-30-302-501",
      generalCategoryId: "189-30-302",
      name: "Confecciones",
      description: "Confecciones textiles nacionales",
    },
    {
      id: "189-30-302-503",
      generalCategoryId: "189-30-302",
      name: "Ajuar",
      description: "Productos de ajuar nacional",
    },
    {
      id: "189-30-302-504",
      generalCategoryId: "189-30-302",
      name: "Quincalla",
      description: "Quincalla nacional",
    },
    {
      id: "189-30-302-505",
      generalCategoryId: "189-30-302",
      name: "Utiles Escolares",
      description: "Útiles escolares nacionales",
    },
    {
      id: "189-30-302-506",
      generalCategoryId: "189-30-302",
      name: "Utiles de Hogar",
      description: "Útiles del hogar nacionales",
    },
    {
      id: "189-30-303-601",
      generalCategoryId: "189-30-303",
      name: "Ropa Reciclada",
      description: "Ropa reciclada importada",
    },
    {
      id: "189-30-304-501",
      generalCategoryId: "189-30-304",
      name: "Confecciones",
      description: "Confecciones locales",
    },
    {
      id: "189-30-304-502",
      generalCategoryId: "189-30-304",
      name: "Calzado",
      description: "Calzado local",
    },
    {
      id: "189-30-304-503",
      generalCategoryId: "189-30-304",
      name: "Ajuar",
      description: "Ajuar local",
    },
    {
      id: "189-30-304-504",
      generalCategoryId: "189-30-304",
      name: "Quincalla",
      description: "Quincalla local",
    },
    {
      id: "189-30-304-506",
      generalCategoryId: "189-30-304",
      name: "Utiles del Hogar",
      description: "Útiles del hogar locales",
    },
    {
      id: "189-30-305-401",
      generalCategoryId: "189-30-305",
      name: "Materiales de la Construccion",
      description: "Materiales de construcción nacionales",
    },
    {
      id: "189-30-306-401",
      generalCategoryId: "189-30-306",
      name: "Materiales de la Construccion",
      description: "Materiales de construcción locales",
    },
    {
      id: "189-30-309-403",
      generalCategoryId: "189-30-309",
      name: "Aseo",
      description: "Productos de aseo",
    },
  ];

  await prisma.category.createMany({
    data: categoriesData,
  });

  console.log(`   ✓ Created ${categoriesData.length} specific categories`);

  // ============================================
  // PRODUCTS
  // ============================================
  console.log("🏷️ Creating products...");

  const productsData = [
    {
      id: "15483",
      categoryId: "189-30-301-31",
      name: "Bermunda Primaria",
      costPrice: 51.7,
      salePrice: 41.5,
      unit: "un",
    },
    {
      id: "15487",
      categoryId: "189-30-301-31",
      name: "Saya Primaria",
      costPrice: 43.26,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "890344",
      categoryId: "189-30-301-31",
      name: "Camisa Primaria",
      costPrice: 55.0177,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "15585",
      categoryId: "189-30-301-31",
      name: "Pantalón Primaria",
      costPrice: 69.778,
      salePrice: 31.5,
      unit: "un",
    },
    {
      id: "15527",
      categoryId: "189-30-302-501",
      name: "Medias de Niño",
      costPrice: 138.45,
      salePrice: 175,
      unit: "un",
    },
    {
      id: "15554",
      categoryId: "189-30-302-501",
      name: "Medias de Niña",
      costPrice: 74.55,
      salePrice: 95,
      unit: "un",
    },
    {
      id: "15599",
      categoryId: "189-30-302-501",
      name: "Medias de Hombre",
      costPrice: 117.15,
      salePrice: 150,
      unit: "un",
    },
    {
      id: "2724636",
      categoryId: "189-30-302-501",
      name: "Gorra",
      costPrice: 600,
      salePrice: 800,
      unit: "un",
    },
    {
      id: "2724643",
      categoryId: "189-30-302-501",
      name: "Camisa M.L de Hombre",
      costPrice: 1620,
      salePrice: 2150,
      unit: "un",
    },
    {
      id: "15563",
      categoryId: "189-30-302-503",
      name: "Sábana Camera",
      costPrice: 1171.5,
      salePrice: 1465,
      unit: "un",
    },
    {
      id: "15598",
      categoryId: "189-30-302-503",
      name: "Sábana Personal",
      costPrice: 1011.75,
      salePrice: 1265,
      unit: "un",
    },
    {
      id: "15574",
      categoryId: "189-30-302-504",
      name: "Fosforera",
      costPrice: 90.7379,
      salePrice: 115,
      unit: "un",
    },
    {
      id: "2724591",
      categoryId: "189-30-302-504",
      name: "Peine de Señora",
      costPrice: 56.7525,
      salePrice: 75,
      unit: "un",
    },
    {
      id: "008A243",
      categoryId: "189-30-302-505",
      name: "Bolígrafo",
      costPrice: 16.5,
      salePrice: 19,
      unit: "un",
    },
    {
      id: "15575",
      categoryId: "189-30-302-505",
      name: "Lapicero Personalizado",
      costPrice: 37.2749,
      salePrice: 50,
      unit: "un",
    },
    {
      id: "15614",
      categoryId: "189-30-302-505",
      name: "Files",
      costPrice: 27.5835,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "2724583",
      categoryId: "189-30-302-505",
      name: "Hoja Carta",
      costPrice: 1970.25,
      salePrice: 2465,
      unit: "un",
    },
    {
      id: "15318",
      categoryId: "189-30-302-506",
      name: "Cortinero",
      costPrice: 232.54,
      salePrice: 275,
      unit: "un",
    },
    {
      id: "15516",
      categoryId: "189-30-302-506",
      name: "Juego de Vasos",
      costPrice: 1118.25,
      salePrice: 1400,
      unit: "un",
    },
    {
      id: "15613",
      categoryId: "189-30-302-506",
      name: "Tomacorriente",
      costPrice: 111.825,
      salePrice: 140,
      unit: "un",
    },
    {
      id: "15619",
      categoryId: "189-30-302-506",
      name: "Suavizante",
      costPrice: 468.6,
      salePrice: 590,
      unit: "un",
    },
    {
      id: "15620",
      categoryId: "189-30-302-506",
      name: "Jabón Líquido",
      costPrice: 289.4457,
      salePrice: 365,
      unit: "un",
    },
    {
      id: "272426",
      categoryId: "189-30-303-601",
      name: "Pantalón de Hombre",
      costPrice: 897.2167,
      salePrice: 1125,
      unit: "un",
    },
    {
      id: "272428",
      categoryId: "189-30-303-601",
      name: "Mini Saya",
      costPrice: 330.974,
      salePrice: 415,
      unit: "un",
    },
    {
      id: "15448",
      categoryId: "189-30-304-501",
      name: "Vestido de Dama Shein",
      costPrice: 2200,
      salePrice: 2750,
      unit: "un",
    },
    {
      id: "15449",
      categoryId: "189-30-304-501",
      name: "Ropa de Niño Shein",
      costPrice: 800,
      salePrice: 1000,
      unit: "un",
    },
    {
      id: "15450",
      categoryId: "189-30-304-501",
      name: "Blunsa de Dama Shein",
      costPrice: 1200,
      salePrice: 1500,
      unit: "un",
    },
    {
      id: "15035",
      categoryId: "189-30-304-502",
      name: "Calzado Artesanal",
      costPrice: 1200,
      salePrice: 1335,
      unit: "un",
    },
    {
      id: "15384",
      categoryId: "189-30-304-502",
      name: "Calzado Femenino Abascal",
      costPrice: 951.3,
      salePrice: 1190,
      unit: "un",
    },
    {
      id: "4400105",
      categoryId: "189-30-304-502",
      name: "Chancletas de Baño",
      costPrice: 600,
      salePrice: 750,
      unit: "un",
    },
    {
      id: "15332",
      categoryId: "189-30-304-503",
      name: "Junego de Sabana c/ fundas",
      costPrice: 1600,
      salePrice: 2000,
      unit: "un",
    },
    {
      id: "15525",
      categoryId: "189-30-304-503",
      name: "Toalla artesanal",
      costPrice: 1280,
      salePrice: 1500,
      unit: "un",
    },
    {
      id: "131750",
      categoryId: "189-30-304-504",
      name: "Keratina",
      costPrice: 341.7,
      salePrice: 430,
      unit: "un",
    },
    {
      id: "2400449",
      categoryId: "189-30-304-504",
      name: "Talco Perfumado",
      costPrice: 60,
      salePrice: 80,
      unit: "un",
    },
    {
      id: "15081",
      categoryId: "189-30-304-506",
      name: "Candado",
      costPrice: 522.5,
      salePrice: 655,
      unit: "un",
    },
    {
      id: "15359",
      categoryId: "189-30-304-506",
      name: "Jaba Artesanal",
      costPrice: 160.5,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "15582",
      categoryId: "189-30-304-506",
      name: "Jabón Líquido 400g",
      costPrice: 150,
      salePrice: 190,
      unit: "un",
    },
    {
      id: "15129",
      categoryId: "189-30-305-401",
      name: "Caja Eléctrica 4x4",
      costPrice: 3.04,
      salePrice: 6.5,
      unit: "un",
    },
    {
      id: "15145",
      categoryId: "189-30-305-401",
      name: "Tee 2ñ",
      costPrice: 22.5,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "15119",
      categoryId: "189-30-306-401",
      name: "Llave",
      costPrice: 45,
      salePrice: 70,
      unit: "un",
    },
    {
      id: "15158",
      categoryId: "189-30-306-401",
      name: "Llave Cañón Largo",
      costPrice: 143.2,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "4400211",
      categoryId: "189-30-306-401",
      name: "Nudo 3/4",
      costPrice: 10.0347,
      salePrice: 40,
      unit: "un",
    },
    {
      id: "131700",
      categoryId: "189-30-309-403",
      name: "Jabón c/ envoltura",
      costPrice: 136.35,
      salePrice: 160,
      unit: "un",
    },
    {
      id: "440111",
      categoryId: "189-30-309-403",
      name: "Gel",
      costPrice: 335.7636,
      salePrice: 300,
      unit: "un",
    },
  ];

  await prisma.product.createMany({
    data: productsData,
  });

  console.log(`   ✓ Created ${productsData.length} products`);

  // ============================================
  // INFLOWS
  // ============================================
  console.log("📥 Creating inflows...");

  await prisma.inflow.createMany({
    data: [
      {
        userId: adminUser.id,
        warehouseId: mainWarehouse.id,
        date: new Date("2024-01-15"),
        inType: "purchase",
        providerCompanyId: textilera!.id,
        payMethod: "TRANSFERMOVIL",
        invoiceNumber: "INV-2024-001",
        inNumber: "IN-001",
        productId: "15483",
        quantity: 100,
        saleAmount: 4150.0,
        costAmount: 5170.0,
      },
      {
        userId: managerUser.id,
        warehouseId: mainWarehouse.id,
        date: new Date("2024-01-20"),
        inType: "purchase",
        providerCompanyId: textilera!.id,
        payMethod: "EFECTIVO",
        invoiceNumber: "INV-2024-002",
        inNumber: "IN-002",
        productId: "15527",
        quantity: 200,
        saleAmount: 35000.0,
        costAmount: 27690.0,
      },
      {
        userId: managerUser.id,
        warehouseId: secondaryWarehouse.id,
        date: new Date("2024-01-22"),
        inType: "purchase",
        providerCompanyId: miCanastilla!.id,
        payMethod: "TRANSFERMOVIL",
        invoiceNumber: "INV-2024-003",
        inNumber: "IN-003",
        productId: "15563",
        quantity: 50,
        saleAmount: 73250.0,
        costAmount: 58575.0,
      },
      {
        userId: regularUser.id,
        warehouseId: downtownWarehouse.id,
        date: new Date("2024-01-25"),
        inType: "transfer",
        providerStoreId: mainStore.id,
        inNumber: "IN-004",
        productId: "008A243",
        quantity: 500,
        saleAmount: 9500.0,
        costAmount: 8250.0,
      },
      {
        userId: adminUser.id,
        warehouseId: downtownWarehouse.id,
        date: new Date("2024-02-01"),
        inType: "purchase",
        providerCompanyId: empCalzado!.id,
        payMethod: "TRANSFERMOVIL",
        invoiceNumber: "INV-2024-004",
        inNumber: "IN-005",
        productId: "15613",
        quantity: 80,
        saleAmount: 11200.0,
        costAmount: 8946.0,
      },
    ],
  });

  // ============================================
  // WAREHOUSE INVENTORY
  // ============================================
  console.log("📦 Creating warehouse inventory...");

  await prisma.warehouseInventory.createMany({
    data: [
      {
        warehouseId: mainWarehouse.id,
        productId: "15483",
        quantity: 80,
        minStock: 20,
      },
      {
        warehouseId: mainWarehouse.id,
        productId: "15527",
        quantity: 180,
        minStock: 50,
      },
      {
        warehouseId: secondaryWarehouse.id,
        productId: "15563",
        quantity: 45,
        minStock: 10,
      },
      {
        warehouseId: downtownWarehouse.id,
        productId: "008A243",
        quantity: 480,
        minStock: 100,
      },
      {
        warehouseId: downtownWarehouse.id,
        productId: "15613",
        quantity: 75,
        minStock: 15,
      },
    ],
  });

  // ============================================
  // OUTFLOWS
  // ============================================
  console.log("📤 Creating outflows...");

  await prisma.outflow.createMany({
    data: [
      {
        userId: adminUser.id,
        warehouseId: mainWarehouse.id,
        date: new Date("2024-02-10"),
        outType: "transfer",
        destinationStoreId: northStore.id,
        outNumber: "OUT-001",
        productId: "15483",
        quantity: 20,
        saleAmount: 830.0,
        costAmount: 1034.0,
      },
      {
        userId: managerUser.id,
        warehouseId: mainWarehouse.id,
        date: new Date("2024-02-12"),
        outType: "internal_transfer",
        destinationSalesAreaId: electronicsAreaMain.id,
        outNumber: "OUT-002",
        productId: "15527",
        quantity: 50,
        saleAmount: 8750.0,
        costAmount: 6922.5,
      },
      {
        userId: managerUser.id,
        warehouseId: secondaryWarehouse.id,
        date: new Date("2024-02-13"),
        outType: "internal_transfer",
        destinationSalesAreaId: clothingAreaMain.id,
        outNumber: "OUT-003",
        productId: "15563",
        quantity: 10,
        saleAmount: 14650.0,
        costAmount: 11715.0,
      },
      {
        userId: regularUser.id,
        warehouseId: downtownWarehouse.id,
        date: new Date("2024-02-14"),
        outType: "internal_transfer",
        destinationSalesAreaId: electronicsAreaDowntown.id,
        outNumber: "OUT-004",
        productId: "008A243",
        quantity: 100,
        saleAmount: 1900.0,
        costAmount: 1650.0,
      },
      {
        userId: adminUser.id,
        warehouseId: downtownWarehouse.id,
        date: new Date("2024-02-15"),
        outType: "return",
        payMethod: "TRANSFERMOVIL",
        outNumber: "OUT-005",
        productId: "15613",
        quantity: 5,
        saleAmount: 700.0,
        costAmount: 559.13,
      },
    ],
  });

  // ============================================
  // SALES AREA INVENTORY
  // ============================================
  console.log("🛍️ Creating sales area inventory...");

  await prisma.salesAreaInventory.createMany({
    data: [
      {
        salesAreaId: electronicsAreaMain.id,
        productId: "15527",
        quantity: 45,
        minStock: 10,
      },
      {
        salesAreaId: clothingAreaMain.id,
        productId: "15563",
        quantity: 8,
        minStock: 3,
      },
      {
        salesAreaId: electronicsAreaDowntown.id,
        productId: "008A243",
        quantity: 95,
        minStock: 20,
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
        userId: adminUser.id,
        salesAreaId: electronicsAreaMain.id,
        date: new Date("2024-02-20"),
        payMethod: "TRANSFERMOVIL",
        productId: "15527",
        quantity: 5,
        saleAmount: 875.0,
        costAmount: 692.25,
      },
      {
        userId: adminUser.id,
        salesAreaId: clothingAreaMain.id,
        date: new Date("2024-02-21"),
        payMethod: "EFECTIVO",
        productId: "15563",
        quantity: 2,
        saleAmount: 2930.0,
        costAmount: 2343.0,
      },
      {
        userId: adminUser.id,
        salesAreaId: electronicsAreaDowntown.id,
        date: new Date("2024-02-22"),
        payMethod: "ENZONA",
        productId: "008A243",
        quantity: 5,
        saleAmount: 95.0,
        costAmount: 82.5,
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
  console.log(
    `   - General Categories: ${await prisma.generalCategory.count()}`
  );
  console.log(`   - Categories: ${await prisma.category.count()}`);
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

  const inflowFromCompany = await prisma.inflow.count({
    where: { providerCompanyId: { not: null } },
  });
  const inflowFromStore = await prisma.inflow.count({
    where: { providerStoreId: { not: null } },
  });
  console.log(`   - Inflows from companies: ${inflowFromCompany}`);
  console.log(`   - Inflows from stores (transfers): ${inflowFromStore}`);

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

  const cashSales = await prisma.sale.count({
    where: { payMethod: "EFECTIVO" },
  });
  const creditSales = await prisma.sale.count({
    where: { payMethod: "TRANSFERMOVIL" },
  });
  const debitSales = await prisma.sale.count({
    where: { payMethod: "ENZONA" },
  });
  console.log(`   - EFECTIVO sales: ${cashSales}`);
  console.log(`   - TRANSFERMOVIL sales: ${creditSales}`);
  console.log(`   - ENZONA sales: ${debitSales}`);

  const totalSales = await prisma.sale.aggregate({
    _sum: { saleAmount: true, costAmount: true },
  });
  const revenue = Number(totalSales._sum.saleAmount || 0);
  const cost = Number(totalSales._sum.costAmount || 0);
  const profit = revenue - cost;

  console.log(`\n💰 Financial Summary:`);
  console.log(`   - Total Sales Revenue: ${revenue.toFixed(2)}`);
  console.log(`   - Total Cost: ${cost.toFixed(2)}`);
  console.log(`   - Gross Profit: ${profit.toFixed(2)}`);
  console.log(`   - Profit Margin: ${((profit / revenue) * 100).toFixed(2)}%`);

  const totalWithdraws = await prisma.withdraw.aggregate({
    _sum: { amount: true },
  });
  console.log(
    `   - Total Withdraws: ${Number(totalWithdraws._sum.amount || 0).toFixed(
      2
    )}`
  );

  const warehouseInventories = await prisma.warehouseInventory.findMany({
    where: { minStock: { not: null } },
  });
  const lowStockWarehouse = warehouseInventories.filter(
    (inv) => inv.minStock !== null && inv.quantity <= inv.minStock
  ).length;

  const salesAreaInventories = await prisma.salesAreaInventory.findMany({
    where: { minStock: { not: null } },
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
