import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Starting database seed...");

  console.log("🧹 Cleaning existing data...");
  await prisma.warehouseInventory.deleteMany();
  await prisma.salesAreaInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.generalCategory.deleteMany();
  await prisma.company.deleteMany();

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
      id: "015483",
      categoryId: "189-30-301-31",
      name: "Bermunda Primaria",
      costPrice: 51.7,
      salePrice: 41.5,
      unit: "un",
    },
    {
      id: "015487",
      categoryId: "189-30-301-31",
      name: "Saya Primaria",
      costPrice: 43.26,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "015584",
      categoryId: "189-30-301-31",
      name: "Blusa Ens Media",
      costPrice: 65.7529,
      salePrice: 31,
      unit: "un",
    },
    {
      id: "015585",
      categoryId: "189-30-301-31",
      name: "Pantalón Primaria",
      costPrice: 69.778,
      salePrice: 31.5,
      unit: "un",
    },
    {
      id: "015586",
      categoryId: "189-30-301-31",
      name: "Pantalon Ens Media",
      costPrice: 129.94,
      salePrice: 61.5,
      unit: "un",
    },
    {
      id: "015591",
      categoryId: "189-30-301-31",
      name: "Blusa Primaria",
      costPrice: 48.2016,
      salePrice: 23,
      unit: "un",
    },
    {
      id: "0751008",
      categoryId: "189-30-301-31",
      name: "Saya Secundaria",
      costPrice: 90.025,
      salePrice: 44.5,
      unit: "un",
    },
    {
      id: "0890344",
      categoryId: "189-30-301-31",
      name: "Camisa Primaria",
      costPrice: 55.0177,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015527",
      categoryId: "189-30-302-501",
      name: "Medias de Niño",
      costPrice: 138.45,
      salePrice: 175,
      unit: "un",
    },
    {
      id: "015528",
      categoryId: "189-30-302-501",
      name: "Medias Bermudas",
      costPrice: 175.7248,
      salePrice: 220,
      unit: "un",
    },
    {
      id: "015531",
      categoryId: "189-30-302-501",
      name: "Medias s/ Punteras",
      costPrice: 127.8,
      salePrice: 160,
      unit: "un",
    },
    {
      id: "015554",
      categoryId: "189-30-302-501",
      name: "Medias de Niña",
      costPrice: 74.55,
      salePrice: 95,
      unit: "un",
    },
    {
      id: "015599",
      categoryId: "189-30-302-501",
      name: "Medias de Hombre",
      costPrice: 117.15,
      salePrice: 150,
      unit: "un",
    },
    {
      id: "015602",
      categoryId: "189-30-302-501",
      name: "Plantilla de Hombre",
      costPrice: 159.75,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "0272395",
      categoryId: "189-30-302-501",
      name: "Medias de Vestir de hombre",
      costPrice: 175.7233,
      salePrice: 235,
      unit: "un",
    },
    {
      id: "02724601",
      categoryId: "189-30-302-501",
      name: "Protector Muñeca Larga",
      costPrice: 79.875,
      salePrice: 100,
      unit: "un",
    },
    {
      id: "02724602",
      categoryId: "189-30-302-501",
      name: "Protector Muñeca Corta",
      costPrice: 74.55,
      salePrice: 95,
      unit: "un",
    },
    {
      id: "02724635",
      categoryId: "189-30-302-501",
      name: "Zapatera",
      costPrice: 2000,
      salePrice: 2500,
      unit: "un",
    },
    {
      id: "02724636",
      categoryId: "189-30-302-501",
      name: "Gorra",
      costPrice: 600,
      salePrice: 800,
      unit: "un",
    },
    {
      id: "02724643",
      categoryId: "189-30-302-501",
      name: "Camisa M.L de Hombre",
      costPrice: 1620,
      salePrice: 2150,
      unit: "un",
    },
    {
      id: "02724646",
      categoryId: "189-30-302-501",
      name: "Shorts de Hombre",
      costPrice: 1620,
      salePrice: 2120,
      unit: "un",
    },
    {
      id: "015563",
      categoryId: "189-30-302-503",
      name: "Sábana Camera",
      costPrice: 1171.5,
      salePrice: 1465,
      unit: "un",
    },
    {
      id: "015598",
      categoryId: "189-30-302-503",
      name: "Sábana Personal",
      costPrice: 1011.75,
      salePrice: 1265,
      unit: "un",
    },
    {
      id: "015574",
      categoryId: "189-30-302-504",
      name: "Fosforera",
      costPrice: 90.7379,
      salePrice: 115,
      unit: "un",
    },
    {
      id: "02724591",
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
      id: "015575",
      categoryId: "189-30-302-505",
      name: "Lapicero Personalizado",
      costPrice: 37.2749,
      salePrice: 50,
      unit: "un",
    },
    {
      id: "015596",
      categoryId: "189-30-302-505",
      name: "Lapicero personalizado",
      costPrice: 37.275,
      salePrice: 50,
      unit: "un",
    },
    {
      id: "015614",
      categoryId: "189-30-302-505",
      name: "Files",
      costPrice: 27.5835,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "02724583",
      categoryId: "189-30-302-505",
      name: "Hoja Carta",
      costPrice: 1970.25,
      salePrice: 2465,
      unit: "un",
    },
    {
      id: "015031",
      categoryId: "189-30-302-506",
      name: "Repuesto",
      costPrice: 8.471,
      salePrice: 11,
      unit: "un",
    },
    {
      id: "015318",
      categoryId: "189-30-302-506",
      name: "Cortinero",
      costPrice: 232.54,
      salePrice: 275,
      unit: "un",
    },
    {
      id: "015516",
      categoryId: "189-30-302-506",
      name: "Juego de Vasos",
      costPrice: 1118.25,
      salePrice: 1400,
      unit: "un",
    },
    {
      id: "015536",
      categoryId: "189-30-302-506",
      name: 'Brocha c/ Mango Plastico 5"',
      costPrice: 1065,
      salePrice: 1340,
      unit: "un",
    },
    {
      id: "015537",
      categoryId: "189-30-302-506",
      name: 'Brocha c/ Mango Plastico 6"',
      costPrice: 1171.5,
      salePrice: 1465,
      unit: "un",
    },
    {
      id: "015538",
      categoryId: "189-30-302-506",
      name: "Caldero",
      costPrice: 17040,
      salePrice: 21300,
      unit: "un",
    },
    {
      id: "015558",
      categoryId: "189-30-302-506",
      name: "Pintura acrilica Marron",
      costPrice: 1288.65,
      salePrice: 1625,
      unit: "un",
    },
    {
      id: "015592",
      categoryId: "189-30-302-506",
      name: "LLavin Doble Tiro",
      costPrice: 4047,
      salePrice: 5060,
      unit: "un",
    },
    {
      id: "015593",
      categoryId: "189-30-302-506",
      name: "Disco de Corte",
      costPrice: 141.645,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "015601",
      categoryId: "189-30-302-506",
      name: "Soporte fijo TV 32 pulg",
      costPrice: 1491,
      salePrice: 1865,
      unit: "un",
    },
    {
      id: "015605",
      categoryId: "189-30-302-506",
      name: "Soporte Caja Descodificadora",
      costPrice: 905.25,
      salePrice: 1140,
      unit: "un",
    },
    {
      id: "015610",
      categoryId: "189-30-302-506",
      name: "Pote de 1lt C/tapa",
      costPrice: 74.55,
      salePrice: 95,
      unit: "un",
    },
    {
      id: "015612",
      categoryId: "189-30-302-506",
      name: "Soga Cordel 15 mt",
      costPrice: 191.7,
      salePrice: 240,
      unit: "un",
    },
    {
      id: "015615",
      categoryId: "189-30-302-506",
      name: "Antena Yagui 5 elementos",
      costPrice: 692.25,
      salePrice: 900,
      unit: "un",
    },
    {
      id: "015618",
      categoryId: "189-30-302-506",
      name: "Agua Tratada",
      costPrice: 159.75,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "015619",
      categoryId: "189-30-302-506",
      name: "Suavizante",
      costPrice: 468.6,
      salePrice: 590,
      unit: "un",
    },
    {
      id: "015620",
      categoryId: "189-30-302-506",
      name: "Jabón Líquido",
      costPrice: 289.4457,
      salePrice: 365,
      unit: "un",
    },
    {
      id: "015629",
      categoryId: "189-30-302-506",
      name: "Teflon",
      costPrice: 543.15,
      salePrice: 680,
      unit: "un",
    },
    {
      id: "0204078",
      categoryId: "189-30-302-506",
      name: "Carretilla de Gas",
      costPrice: 1917,
      salePrice: 2400,
      unit: "un",
    },
    {
      id: "0272409",
      categoryId: "189-30-302-506",
      name: "Manguera 8m",
      costPrice: 18.9038,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "0272410",
      categoryId: "189-30-302-506",
      name: "Manguera 10m",
      costPrice: 25.4002,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "02724588",
      categoryId: "189-30-302-506",
      name: "Cepillo de Lavar",
      costPrice: 340.495,
      salePrice: 430,
      unit: "un",
    },
    {
      id: "02724657",
      categoryId: "189-30-302-506",
      name: "Caja Cerveza",
      costPrice: 145.958,
      salePrice: 190,
      unit: "un",
    },
    {
      id: "015004",
      categoryId: "189-30-302-501",
      name: "Triquini",
      costPrice: 10.28,
      salePrice: 150,
      unit: "un",
    },
    {
      id: "015055B",
      categoryId: "189-30-304-502",
      name: "Cinto",
      costPrice: 300,
      salePrice: 375,
      unit: "un",
    },
    {
      id: "015078",
      categoryId: "189-30-304-502",
      name: "Botas Coloso",
      costPrice: 396.6,
      salePrice: 500,
      unit: "un",
    },
    {
      id: "04400105",
      categoryId: "189-30-304-502",
      name: "Chancletas Baño",
      costPrice: 600,
      salePrice: 375,
      unit: "un",
    },
    {
      id: "015530",
      categoryId: "189-30-302-501",
      name: "Medias c/ Punteras",
      costPrice: 127.8,
      salePrice: 160,
      unit: "un",
    },
    {
      id: "015562",
      categoryId: "189-30-302-501",
      name: "Medias c/ Punteras",
      costPrice: 127.8,
      salePrice: 160,
      unit: "un",
    },
    {
      id: "015603",
      categoryId: "189-30-302-501",
      name: "Plantillas de Niña",
      costPrice: 106.5,
      salePrice: 135,
      unit: "un",
    },
    {
      id: "015604",
      categoryId: "189-30-302-501",
      name: "Plantilla Unisex",
      costPrice: 159.75,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "015616",
      categoryId: "189-30-302-501",
      name: "Plantillas",
      costPrice: 101.175,
      salePrice: 130,
      unit: "un",
    },
    {
      id: "015617",
      categoryId: "189-30-302-501",
      name: "Medias s/ Punteras",
      costPrice: 127.8,
      salePrice: 160,
      unit: "un",
    },
    {
      id: "0252500",
      categoryId: "189-30-302-501",
      name: "Medias de Niña",
      costPrice: 149.1,
      salePrice: 190,
      unit: "un",
    },
    {
      id: "02724596",
      categoryId: "189-30-302-501",
      name: "Medias p/ Niña",
      costPrice: 149.1,
      salePrice: 190,
      unit: "un",
    },
    {
      id: "02724598",
      categoryId: "189-30-302-501",
      name: "Plantilla p/ Niña",
      costPrice: 106.5,
      salePrice: 135,
      unit: "un",
    },
    {
      id: "02724599",
      categoryId: "189-30-302-501",
      name: "Plantillas Unisex",
      costPrice: 159.75,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "02724600",
      categoryId: "189-30-302-501",
      name: "Plantillas",
      costPrice: 101.1749,
      salePrice: 130,
      unit: "un",
    },
    {
      id: "02724641",
      categoryId: "189-30-302-501",
      name: "Juego de Paños de Cocina",
      costPrice: 750,
      salePrice: 900,
      unit: "un",
    },
    {
      id: "02724642",
      categoryId: "189-30-302-501",
      name: "Juego Toallas 2 Pzas",
      costPrice: 1620,
      salePrice: 2100,
      unit: "un",
    },
    {
      id: "02724645",
      categoryId: "189-30-302-501",
      name: "Manteles",
      costPrice: 1620,
      salePrice: 2120,
      unit: "un",
    },
    {
      id: "02724647",
      categoryId: "189-30-302-501",
      name: "Jakect de Hombre",
      costPrice: 1620,
      salePrice: 2120,
      unit: "un",
    },
    {
      id: "0272503",
      categoryId: "189-30-302-501",
      name: "Medias Bermudas",
      costPrice: 175.7248,
      salePrice: 220,
      unit: "un",
    },
    {
      id: "015067",
      categoryId: "189-30-304-501",
      name: "Conjunto de Adornos",
      costPrice: 20,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015449",
      categoryId: "189-30-304-501",
      name: "Ropa de Niño Shein",
      costPrice: 800,
      salePrice: 1000,
      unit: "un",
    },
    {
      id: "015467",
      categoryId: "189-30-304-501",
      name: "Pullover de Niño",
      costPrice: 285,
      salePrice: 360,
      unit: "un",
    },
    {
      id: "015489",
      categoryId: "189-30-304-501",
      name: "Juego de Dormir III",
      costPrice: 540,
      salePrice: 675,
      unit: "un",
    },
    {
      id: "0180175",
      categoryId: "189-30-304-501",
      name: "Vestido",
      costPrice: 650,
      salePrice: 815,
      unit: "un",
    },
    {
      id: "015129",
      categoryId: "189-30-305-401",
      name: "Caja Eléctrica 4x4",
      costPrice: 3.04,
      salePrice: 6.5,
      unit: "un",
    },
    {
      id: "015135",
      categoryId: "189-30-305-401",
      name: "Caja Eléctrica",
      costPrice: 1.9333,
      salePrice: 5,
      unit: "un",
    },
    {
      id: "015145",
      categoryId: "189-30-305-401",
      name: 'T 2"',
      costPrice: 22.5,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015146",
      categoryId: "189-30-305-401",
      name: "Universal",
      costPrice: 119.2247,
      salePrice: 85,
      unit: "un",
    },
    {
      id: "015A130",
      categoryId: "189-30-305-401",
      name: "Caja Eléctrica",
      costPrice: 1.8167,
      salePrice: 5,
      unit: "un",
    },
    {
      id: "02724511",
      categoryId: "189-30-305-401",
      name: "Matajuntas",
      costPrice: 18.1387,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015119",
      categoryId: "189-30-306-401",
      name: "Llave",
      costPrice: 45,
      salePrice: 70,
      unit: "un",
    },
    {
      id: "015158",
      categoryId: "189-30-306-401",
      name: "Llave Cañón Largo",
      costPrice: 143.2,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "015159",
      categoryId: "189-30-306-401",
      name: "Llave 1/2 Fregadero",
      costPrice: 143.2,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "015A160",
      categoryId: "189-30-306-401",
      name: "Llave p/ Manguera",
      costPrice: 142.3,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "011CH47",
      categoryId: "189-30-302-505",
      name: "Lapiceros",
      costPrice: 37.275,
      salePrice: 47,
      unit: "un",
    },
    {
      id: "015506",
      categoryId: "189-30-301-31",
      name: "Camisa Ens. Media",
      costPrice: 68.1068,
      salePrice: 31.5,
      unit: "un",
    },
    {
      id: "015523",
      categoryId: "189-30-301-31",
      name: "Camisa Ens. Media",
      costPrice: 68.1069,
      salePrice: 31.5,
      unit: "un",
    },
    {
      id: "015587",
      categoryId: "189-30-301-31",
      name: "Bermuda Primaria",
      costPrice: 87.4475,
      salePrice: 41.5,
      unit: "un",
    },
    {
      id: "0272455",
      categoryId: "189-30-301-31",
      name: "Blusa Secundaria",
      costPrice: 65.7533,
      salePrice: 31,
      unit: "un",
    },
    {
      id: "02724612",
      categoryId: "189-30-301-31",
      name: "Saya Secundaria",
      costPrice: 90.0248,
      salePrice: 44.5,
      unit: "un",
    },
    {
      id: "02724614",
      categoryId: "189-30-301-31",
      name: "Pantalón Ens. Media",
      costPrice: 129.615,
      salePrice: 61.5,
      unit: "un",
    },
    {
      id: "04400156",
      categoryId: "189-30-304-504",
      name: "Keratina",
      costPrice: 346.8,
      salePrice: 300,
      unit: "un",
    },
    {
      id: "04400224",
      categoryId: "189-30-304-504",
      name: "Talco Industrial",
      costPrice: 60,
      salePrice: 80,
      unit: "un",
    },
    {
      id: "0272426",
      categoryId: "189-30-303-601",
      name: "Pantalón de Hombre",
      costPrice: 897.2175,
      salePrice: 1125,
      unit: "un",
    },
    {
      id: "015081",
      categoryId: "189-30-304-506",
      name: "Candado",
      costPrice: 522.5,
      salePrice: 655,
      unit: "un",
    },
    {
      id: "015082",
      categoryId: "189-30-304-506",
      name: "Candado",
      costPrice: 470.25,
      salePrice: 590,
      unit: "un",
    },
    {
      id: "015097",
      categoryId: "189-30-304-506",
      name: "Caja de Cumpleaño",
      costPrice: 2.5028,
      salePrice: 3,
      unit: "un",
    },
    {
      id: "015343",
      categoryId: "189-30-304-506",
      name: "Cordel 9m",
      costPrice: 50.735,
      salePrice: 65,
      unit: "un",
    },
    {
      id: "015359",
      categoryId: "189-30-304-506",
      name: "Jaba Artesanal",
      costPrice: 160.5,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "015391",
      categoryId: "189-30-304-506",
      name: "Aragan Plastico c/ palo",
      costPrice: 158.55,
      salePrice: 250,
      unit: "un",
    },
    {
      id: "015C075",
      categoryId: "189-30-304-506",
      name: "Campeon",
      costPrice: 22.99,
      salePrice: 30,
      unit: "un",
    },
    {
      id: "02724559",
      categoryId: "189-30-304-506",
      name: "Bolsa de Basura",
      costPrice: 7.9728,
      salePrice: 15,
      unit: "un",
    },
    {
      id: "0430020",
      categoryId: "189-30-304-506",
      name: "Fosfoforera",
      costPrice: 70.35,
      salePrice: 90,
      unit: "un",
    },
    {
      id: "093006",
      categoryId: "189-30-304-506",
      name: "Cesto s/ Tapa",
      costPrice: 210,
      salePrice: 260,
      unit: "un",
    },
    {
      id: "015332",
      categoryId: "189-30-304-503",
      name: "Juego de Sábana c/ Fundas",
      costPrice: 1600,
      salePrice: 2000,
      unit: "un",
    },
    {
      id: "015630",
      categoryId: "189-30-302-506",
      name: "Detergente de lavar",
      costPrice: 1701,
      salePrice: 2130,
      unit: "un",
    },
    {
      id: "0272452",
      categoryId: "189-30-302-506",
      name: "Soga de Nylon",
      costPrice: 69.225,
      salePrice: 87,
      unit: "un",
    },
    {
      id: "015040",
      categoryId: "189-30-304-506",
      name: "Registro",
      costPrice: 1.3051,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015613",
      categoryId: "189-30-302-506",
      name: "Tomacorriente",
      costPrice: 111.825,
      salePrice: 140,
      unit: "un",
    },
    {
      id: "015632",
      categoryId: "189-30-302-506",
      name: "Super Transp. Pintura",
      costPrice: 852,
      salePrice: 1080,
      unit: "un",
    },
    {
      id: "040475",
      categoryId: "189-30-302-506",
      name: "Pintura Vinil",
      costPrice: 206.15,
      salePrice: 260,
      unit: "un",
    },
    {
      id: "0440165",
      categoryId: "189-30-304-502",
      name: "Chancletas",
      costPrice: 600,
      salePrice: 375,
      unit: "un",
    },
    {
      id: "01128231",
      categoryId: "189-30-304-501",
      name: "Pantalón de Mezclilla",
      costPrice: 1200,
      salePrice: 1500,
      unit: "un",
    },
    {
      id: "015524",
      categoryId: "189-30-304-501",
      name: "Hilo",
      costPrice: 16,
      salePrice: 20,
      unit: "un",
    },
    {
      id: "015594",
      categoryId: "189-30-302-505",
      name: "Presilla p/ Presilladora",
      costPrice: 383.4,
      salePrice: 480,
      unit: "un",
    },
    {
      id: "02724595",
      categoryId: "189-30-302-505",
      name: "Lápices Personalizados",
      costPrice: 37.275,
      salePrice: 50,
      unit: "un",
    },
    {
      id: "0272484",
      categoryId: "189-30-302-505",
      name: "Bolígrafo",
      costPrice: 26.625,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "0131750",
      categoryId: "189-30-304-504",
      name: "Keratina",
      costPrice: 26.625,
      salePrice: 35,
      unit: "un",
    },
    {
      id: "02400449",
      categoryId: "189-30-304-504",
      name: "Talco Perfumado",
      costPrice: 60,
      salePrice: 80,
      unit: "un",
    },
    {
      id: "0272427",
      categoryId: "189-30-303-601",
      name: "Pantalón de Mujer",
      costPrice: 897.218,
      salePrice: 1125,
      unit: "un",
    },
    {
      id: "0272428",
      categoryId: "189-30-303-601",
      name: "Mini Saya",
      costPrice: 330.974,
      salePrice: 415,
      unit: "un",
    },
    {
      id: "0272429",
      categoryId: "189-30-303-601",
      name: "Bermuda",
      costPrice: 590.17,
      salePrice: 740,
      unit: "un",
    },
    {
      id: "015597",
      categoryId: "189-30-302-506",
      name: "Perchero Reforzado",
      costPrice: 7.455,
      salePrice: 15,
      unit: "un",
    },
    {
      id: "02724582",
      categoryId: "189-30-302-506",
      name: "Tomacorriente Doble",
      costPrice: 111.8249,
      salePrice: 140,
      unit: "un",
    },
    {
      id: "02724597",
      categoryId: "189-30-302-506",
      name: "Perchero de Canastilla",
      costPrice: 18.0518,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "01114410",
      categoryId: "189-30-304-506",
      name: "Capa de Niño",
      costPrice: 800,
      salePrice: 1000,
      unit: "un",
    },
    {
      id: "015580",
      categoryId: "189-30-304-506",
      name: "Soga Cordel",
      costPrice: 180,
      salePrice: 250,
      unit: "un",
    },
    {
      id: "015582",
      categoryId: "189-30-304-506",
      name: "Jabón Líquido 400g",
      costPrice: 150,
      salePrice: 190,
      unit: "un",
    },
    {
      id: "015583",
      categoryId: "189-30-304-506",
      name: "Jablina",
      costPrice: 290,
      salePrice: 365,
      unit: "un",
    },
    {
      id: "04400168",
      categoryId: "189-30-304-506",
      name: "Soga",
      costPrice: 65,
      salePrice: 90,
      unit: "un",
    },
    {
      id: "0132050",
      categoryId: "189-30-304-504",
      name: "Velas",
      costPrice: 66.95,
      salePrice: 85,
      unit: "un",
    },
    {
      id: "02400453",
      categoryId: "189-30-304-503",
      name: "Toalla",
      costPrice: 1250,
      salePrice: 1600,
      unit: "un",
    },
    {
      id: "02400498",
      categoryId: "189-30-304-503",
      name: "Sábanas",
      costPrice: 1300,
      salePrice: 1750,
      unit: "un",
    },
    {
      id: "0131700",
      categoryId: "189-30-309-403",
      name: "Jabon c/ envoltura",
      costPrice: 136.35,
      salePrice: 200,
      unit: "un",
    },
    {
      id: "040198",
      categoryId: "189-30-304-506",
      name: "Balde Plástico",
      costPrice: 850,
      salePrice: 1150,
      unit: "un",
    },
    {
      id: "0440111",
      categoryId: "189-30-304-506",
      name: "Escoba Plástica",
      costPrice: 380,
      salePrice: 520,
      unit: "un",
    },
    {
      id: "015102A",
      categoryId: "189-30-309-403",
      name: "Vaso Plástico",
      costPrice: 95,
      salePrice: 140,
      unit: "un",
    },
    {
      id: "0180023",
      categoryId: "189-30-309-403",
      name: "Cuchara de Metal",
      costPrice: 210,
      salePrice: 300,
      unit: "un",
    },
    {
      id: "0180024",
      categoryId: "189-30-309-403",
      name: "Tenedor de Metal",
      costPrice: 210,
      salePrice: 300,
      unit: "un",
    },
    {
      id: "018301",
      categoryId: "189-30-309-403",
      name: "Plato Plástico",
      costPrice: 180,
      salePrice: 260,
      unit: "un",
    },
    {
      id: "093318A",
      categoryId: "189-30-309-403",
      name: "Jarra Plástica",
      costPrice: 520,
      salePrice: 750,
      unit: "un",
    },
    {
      id: "02724639",
      categoryId: "189-30-301-31",
      name: "Galleta Dulce",
      costPrice: 65,
      salePrice: 100,
      unit: "un",
    },
    {
      id: "01121128",
      categoryId: "189-30-301-31",
      name: "Pan Empacado",
      costPrice: 90,
      salePrice: 140,
      unit: "un",
    },
    {
      id: "015099",
      categoryId: "189-30-309-403",
      name: "Bolsa Plástica",
      costPrice: 12,
      salePrice: 25,
      unit: "un",
    },
    {
      id: "015109A",
      categoryId: "189-30-309-403",
      name: "Copa Plástica",
      costPrice: 120,
      salePrice: 180,
      unit: "un",
    },
    {
      id: "015444",
      categoryId: "189-30-309-403",
      name: "Plato Hondo",
      costPrice: 230,
      salePrice: 330,
      unit: "un",
    },
    {
      id: "015448",
      categoryId: "189-30-309-403",
      name: "Plato Llano",
      costPrice: 230,
      salePrice: 330,
      unit: "un",
    },
    {
      id: "015450",
      categoryId: "189-30-309-403",
      name: "Taza",
      costPrice: 310,
      salePrice: 450,
      unit: "un",
    },
    {
      id: "015451",
      categoryId: "189-30-309-403",
      name: "Pocillo",
      costPrice: 280,
      salePrice: 420,
      unit: "un",
    },
    {
      id: "015453",
      categoryId: "189-30-309-403",
      name: "Cuchillo",
      costPrice: 190,
      salePrice: 280,
      unit: "un",
    },
    {
      id: "015455",
      categoryId: "189-30-309-403",
      name: "Tenedor",
      costPrice: 190,
      salePrice: 280,
      unit: "un",
    },
    {
      id: "015456",
      categoryId: "189-30-309-403",
      name: "Cuchara",
      costPrice: 190,
      salePrice: 280,
      unit: "un",
    },
    {
      id: "015458",
      categoryId: "189-30-309-403",
      name: "Vaso de Vidrio",
      costPrice: 350,
      salePrice: 520,
      unit: "un",
    },
    {
      id: "015459",
      categoryId: "189-30-309-403",
      name: "Jarra de Vidrio",
      costPrice: 780,
      salePrice: 1100,
      unit: "un",
    },
    {
      id: "015460",
      categoryId: "189-30-309-403",
      name: "Fuente",
      costPrice: 560,
      salePrice: 820,
      unit: "un",
    },
    {
      id: "015461",
      categoryId: "189-30-309-403",
      name: "Bandeja",
      costPrice: 620,
      salePrice: 900,
      unit: "un",
    },
    {
      id: "015476",
      categoryId: "189-30-309-403",
      name: "Plato de Postre",
      costPrice: 210,
      salePrice: 310,
      unit: "un",
    },
    {
      id: "015490",
      categoryId: "189-30-309-403",
      name: "Vaso Térmico",
      costPrice: 420,
      salePrice: 650,
      unit: "un",
    },
    {
      id: "015B067",
      categoryId: "189-30-309-403",
      name: "Reducido 1 x 1/2",
      costPrice: 6.66,
      salePrice: 55,
      unit: "un",
    },
    {
      id: "0240029",
      categoryId: "189-30-304-503",
      name: "Frazada",
      costPrice: 2200,
      salePrice: 3000,
      unit: "un",
    },
    {
      id: "0270032",
      categoryId: "189-30-301-31",
      name: "Galleta Salada",
      costPrice: 75,
      salePrice: 120,
      unit: "un",
    },
    {
      id: "015160",
      categoryId: "189-30-309-403",
      name: "Vaso Chico",
      costPrice: 160,
      salePrice: 240,
      unit: "un",
    },
    {
      id: "04400207",
      categoryId: "189-30-304-506",
      name: "Escobillón",
      costPrice: 420,
      salePrice: 600,
      unit: "un",
    },
    {
      id: "04400208",
      categoryId: "189-30-304-506",
      name: "Trapo de Piso",
      costPrice: 310,
      salePrice: 460,
      unit: "un",
    },
    {
      id: "04400211",
      categoryId: "189-30-304-506",
      name: "Pala",
      costPrice: 360,
      salePrice: 520,
      unit: "un",
    },
    {
      id: "04400212",
      categoryId: "189-30-304-506",
      name: "Escoba de Madera",
      costPrice: 480,
      salePrice: 700,
      unit: "un",
    },
    {
      id: "04400214",
      categoryId: "189-30-304-506",
      name: "Lampazo",
      costPrice: 530,
      salePrice: 780,
      unit: "un",
    },
    {
      id: "02724561",
      categoryId: "189-30-301-31",
      name: "Galleta Rellena",
      costPrice: 85,
      salePrice: 130,
      unit: "un",
    },
    {
      id: "040221",
      categoryId: "189-30-304-506",
      name: "Palangana Plástica",
      costPrice: 220,
      salePrice: 315,
      unit: "un",
    },
    {
      id: "040495",
      categoryId: "189-30-304-506",
      name: "Cepillo de Lavar",
      costPrice: 60,
      salePrice: 80,
      unit: "un",
    },
  ];

  await prisma.product.createMany({
    data: productsData,
  });

  console.log(`   ✓ Created ${productsData.length} products`);

  // ============================================
  // WAREHOUSE INVENTORY
  // ============================================
  console.log("📦 Creating warehouse inventory...");

  const almacen = await prisma.warehouse.findUnique({
    where: { id: "cmjxgy6f000022bqmq3clq0mz" },
  });

  if (almacen) {
    const almacenInventoryData = [
      { warehouseId: almacen.id, productId: "015563", quantity: 6 },
      { warehouseId: almacen.id, productId: "015598", quantity: 2 },
      { warehouseId: almacen.id, productId: "015332", quantity: 9 },
      { warehouseId: almacen.id, productId: "015055B", quantity: 1 },
      { warehouseId: almacen.id, productId: "015078", quantity: 1 },
      { warehouseId: almacen.id, productId: "04400105", quantity: 62 },
      { warehouseId: almacen.id, productId: "015004", quantity: 1 },
      { warehouseId: almacen.id, productId: "015527", quantity: 192 },
      { warehouseId: almacen.id, productId: "015530", quantity: 60 },
      { warehouseId: almacen.id, productId: "015531", quantity: 280 },
      { warehouseId: almacen.id, productId: "015562", quantity: 178 },
      { warehouseId: almacen.id, productId: "015599", quantity: 665 },
      { warehouseId: almacen.id, productId: "015602", quantity: 1026 },
      { warehouseId: almacen.id, productId: "015603", quantity: 795 },
      { warehouseId: almacen.id, productId: "015604", quantity: 600 },
      { warehouseId: almacen.id, productId: "015616", quantity: 390 },
      { warehouseId: almacen.id, productId: "015617", quantity: 500 },
      { warehouseId: almacen.id, productId: "0252500", quantity: 25 },
      { warehouseId: almacen.id, productId: "02724596", quantity: 80 },
      { warehouseId: almacen.id, productId: "02724598", quantity: 244 },
      { warehouseId: almacen.id, productId: "02724599", quantity: 33 },
      { warehouseId: almacen.id, productId: "02724600", quantity: 65 },
      { warehouseId: almacen.id, productId: "02724641", quantity: 2 },
      { warehouseId: almacen.id, productId: "02724642", quantity: 5 },
      { warehouseId: almacen.id, productId: "02724645", quantity: 2 },
      { warehouseId: almacen.id, productId: "02724647", quantity: 7 },
      { warehouseId: almacen.id, productId: "0272503", quantity: 21 },
      { warehouseId: almacen.id, productId: "015067", quantity: 100 },
      { warehouseId: almacen.id, productId: "015449", quantity: 1 },
      { warehouseId: almacen.id, productId: "015467", quantity: 28 },
      { warehouseId: almacen.id, productId: "015489", quantity: 30 },
      { warehouseId: almacen.id, productId: "0180175", quantity: 5 },
      { warehouseId: almacen.id, productId: "015129", quantity: 2 },
      { warehouseId: almacen.id, productId: "015135", quantity: 3 },
      { warehouseId: almacen.id, productId: "015145", quantity: 7 },
      { warehouseId: almacen.id, productId: "015146", quantity: 17 },
      { warehouseId: almacen.id, productId: "015A130", quantity: 3 },
      { warehouseId: almacen.id, productId: "02724511", quantity: 200 },
      { warehouseId: almacen.id, productId: "015119", quantity: 34 },
      { warehouseId: almacen.id, productId: "015158", quantity: 3 },
      { warehouseId: almacen.id, productId: "015159", quantity: 31 },
      { warehouseId: almacen.id, productId: "015A160", quantity: 5 },
      { warehouseId: almacen.id, productId: "008A243", quantity: 15 },
      { warehouseId: almacen.id, productId: "011CH47", quantity: 500 },
      { warehouseId: almacen.id, productId: "015596", quantity: 225 },
      { warehouseId: almacen.id, productId: "015614", quantity: 600 },
      { warehouseId: almacen.id, productId: "02724583", quantity: 4 },
      { warehouseId: almacen.id, productId: "015483", quantity: 28 },
      { warehouseId: almacen.id, productId: "015487", quantity: 128 },
      { warehouseId: almacen.id, productId: "015506", quantity: 274 },
      { warehouseId: almacen.id, productId: "015523", quantity: 51 },
      { warehouseId: almacen.id, productId: "015585", quantity: 3 },
      { warehouseId: almacen.id, productId: "015587", quantity: 28 },
      { warehouseId: almacen.id, productId: "015591", quantity: 47 },
      { warehouseId: almacen.id, productId: "0272455", quantity: 24 },
      { warehouseId: almacen.id, productId: "02724612", quantity: 27 },
      { warehouseId: almacen.id, productId: "02724614", quantity: 90 },
      { warehouseId: almacen.id, productId: "0890344", quantity: 23 },
      { warehouseId: almacen.id, productId: "02724591", quantity: 3 },
      { warehouseId: almacen.id, productId: "04400156", quantity: 5 },
      { warehouseId: almacen.id, productId: "04400224", quantity: 564 },
      { warehouseId: almacen.id, productId: "0272426", quantity: 4 },
      { warehouseId: almacen.id, productId: "015031", quantity: 347 },
      { warehouseId: almacen.id, productId: "015318", quantity: 3 },
      { warehouseId: almacen.id, productId: "015516", quantity: 10 },
      { warehouseId: almacen.id, productId: "015538", quantity: 1 },
      { warehouseId: almacen.id, productId: "015558", quantity: 10 },
      { warehouseId: almacen.id, productId: "015610", quantity: 240 },
      { warehouseId: almacen.id, productId: "015612", quantity: 50 },
      { warehouseId: almacen.id, productId: "015613", quantity: 48 },
      { warehouseId: almacen.id, productId: "015619", quantity: 7 },
      { warehouseId: almacen.id, productId: "015620", quantity: 50 },
      { warehouseId: almacen.id, productId: "015629", quantity: 5 },
      { warehouseId: almacen.id, productId: "015630", quantity: 2 },
      { warehouseId: almacen.id, productId: "015632", quantity: 67 },
      { warehouseId: almacen.id, productId: "0204078", quantity: 9 },
      { warehouseId: almacen.id, productId: "0272452", quantity: 50 },
      { warehouseId: almacen.id, productId: "02724657", quantity: 5 },
      { warehouseId: almacen.id, productId: "040475", quantity: 20 },
      { warehouseId: almacen.id, productId: "015040", quantity: 37 },
      { warehouseId: almacen.id, productId: "015081", quantity: 6 },
      { warehouseId: almacen.id, productId: "015082", quantity: 4 },
      { warehouseId: almacen.id, productId: "015097", quantity: 0 },
      { warehouseId: almacen.id, productId: "015343", quantity: 2 },
      { warehouseId: almacen.id, productId: "015359", quantity: 16 },
      { warehouseId: almacen.id, productId: "015391", quantity: 20 },
      { warehouseId: almacen.id, productId: "015C075", quantity: 13 },
      { warehouseId: almacen.id, productId: "02724559", quantity: 3033 },
      { warehouseId: almacen.id, productId: "0430020", quantity: 1 },
      { warehouseId: almacen.id, productId: "093006", quantity: 2 },
    ];

    const inventoryProductIds = almacenInventoryData.map((i) => i.productId);

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: inventoryProductIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));

    const missingIds = inventoryProductIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      console.error("❌ Productos inexistentes en Product:", missingIds);
      throw new Error("Seed detenido por productos faltantes");
    }

    await prisma.warehouseInventory.createMany({
      data: almacenInventoryData,
    });
  }

  // ============================================
  // SALES AREA INVENTORY
  // ============================================
  console.log("🛍️ Creating sales area inventory...");

  const glorieta = await prisma.salesArea.findUnique({
    where: { id: "cmjxgy6f400042bqmkjdsljxq" },
  });

  if (glorieta) {
    const glorietaInventoryData = [
      { salesAreaId: glorieta.id, productId: "015332", quantity: 3 },
      { salesAreaId: glorieta.id, productId: "0440165", quantity: 7 },
      { salesAreaId: glorieta.id, productId: "015531", quantity: 107 },
      { salesAreaId: glorieta.id, productId: "015599", quantity: 180 },
      { salesAreaId: glorieta.id, productId: "015602", quantity: 180 },
      { salesAreaId: glorieta.id, productId: "0252500", quantity: 2 },
      { salesAreaId: glorieta.id, productId: "02724601", quantity: 85 },
      { salesAreaId: glorieta.id, productId: "02724602", quantity: 92 },
      { salesAreaId: glorieta.id, productId: "0272503", quantity: 28 },
      { salesAreaId: glorieta.id, productId: "01128231", quantity: 2 },
      { salesAreaId: glorieta.id, productId: "015524", quantity: 45 },
      { salesAreaId: glorieta.id, productId: "015575", quantity: 70 },
      { salesAreaId: glorieta.id, productId: "015594", quantity: 9 },
      { salesAreaId: glorieta.id, productId: "015596", quantity: 200 },
      { salesAreaId: glorieta.id, productId: "02724595", quantity: 200 },
      { salesAreaId: glorieta.id, productId: "0272484", quantity: 127 },
      { salesAreaId: glorieta.id, productId: "015574", quantity: 79 },
      { salesAreaId: glorieta.id, productId: "0131750", quantity: 24 },
      { salesAreaId: glorieta.id, productId: "0132050", quantity: 18 },
      { salesAreaId: glorieta.id, productId: "02400449", quantity: 2 },
      { salesAreaId: glorieta.id, productId: "04400224", quantity: 2 },
      { salesAreaId: glorieta.id, productId: "0272426", quantity: 3 },
      { salesAreaId: glorieta.id, productId: "0272427", quantity: 5 },
      { salesAreaId: glorieta.id, productId: "0272428", quantity: 5 },
      { salesAreaId: glorieta.id, productId: "0272429", quantity: 5 },
      { salesAreaId: glorieta.id, productId: "015516", quantity: 2 },
      { salesAreaId: glorieta.id, productId: "015593", quantity: 17 },
      { salesAreaId: glorieta.id, productId: "015597", quantity: 136 },
      { salesAreaId: glorieta.id, productId: "015610", quantity: 47 },
      { salesAreaId: glorieta.id, productId: "015615", quantity: 9 },
      { salesAreaId: glorieta.id, productId: "015619", quantity: 8 },
      { salesAreaId: glorieta.id, productId: "02724582", quantity: 87 },
      { salesAreaId: glorieta.id, productId: "02724597", quantity: 120 },
      { salesAreaId: glorieta.id, productId: "01114410", quantity: 6 },
      { salesAreaId: glorieta.id, productId: "015580", quantity: 23 },
      { salesAreaId: glorieta.id, productId: "015582", quantity: 18 },
      { salesAreaId: glorieta.id, productId: "015583", quantity: 23 },
      { salesAreaId: glorieta.id, productId: "02724559", quantity: 161 },
      { salesAreaId: glorieta.id, productId: "04400168", quantity: 703 },
    ];

    const inventoryProductIds = glorietaInventoryData.map((i) => i.productId);

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: inventoryProductIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));

    const missingIds = inventoryProductIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      console.error("❌ Productos inexistentes en Product:", missingIds);
      throw new Error("Seed detenido por productos faltantes");
    }

    await prisma.salesAreaInventory.createMany({
      data: glorietaInventoryData,
    });
  }

  const terminal = await prisma.salesArea.findUnique({
    where: { id: "cmjxgy6f200032bqma3h6pxwz" },
  });

  if (terminal) {
    const terminalInventoryData = [
      { salesAreaId: terminal.id, productId: "015332", quantity: 3 },
      { salesAreaId: terminal.id, productId: "02400453", quantity: 33 },
      { salesAreaId: terminal.id, productId: "02400498", quantity: 19 },
      { salesAreaId: terminal.id, productId: "0131700", quantity: 46 },
      { salesAreaId: terminal.id, productId: "040198", quantity: 14 },
      { salesAreaId: terminal.id, productId: "0440111", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015102A", quantity: 1 },
      { salesAreaId: terminal.id, productId: "0180023", quantity: 3 },
      { salesAreaId: terminal.id, productId: "0180024", quantity: 2 },
      { salesAreaId: terminal.id, productId: "018301", quantity: 3 },
      { salesAreaId: terminal.id, productId: "04400105", quantity: 8 },
      { salesAreaId: terminal.id, productId: "0440165", quantity: 8 },
      { salesAreaId: terminal.id, productId: "093318A", quantity: 8 },
      { salesAreaId: terminal.id, productId: "015528", quantity: 29 },
      { salesAreaId: terminal.id, productId: "015531", quantity: 92 },
      { salesAreaId: terminal.id, productId: "015602", quantity: 65 },
      { salesAreaId: terminal.id, productId: "0272395", quantity: 3 },
      { salesAreaId: terminal.id, productId: "02724601", quantity: 40 },
      { salesAreaId: terminal.id, productId: "02724602", quantity: 38 },
      { salesAreaId: terminal.id, productId: "02724635", quantity: 3 },
      { salesAreaId: terminal.id, productId: "02724636", quantity: 8 },
      { salesAreaId: terminal.id, productId: "02724639", quantity: 17 },
      { salesAreaId: terminal.id, productId: "02724641", quantity: 4 },
      { salesAreaId: terminal.id, productId: "02724642", quantity: 10 },
      { salesAreaId: terminal.id, productId: "02724643", quantity: 12 },
      { salesAreaId: terminal.id, productId: "02724645", quantity: 5 },
      { salesAreaId: terminal.id, productId: "02724646", quantity: 16 },
      { salesAreaId: terminal.id, productId: "02724647", quantity: 3 },
      { salesAreaId: terminal.id, productId: "01121128", quantity: 60 },
      { salesAreaId: terminal.id, productId: "01128231", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015099", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015109A", quantity: 4 },
      { salesAreaId: terminal.id, productId: "015444", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015448", quantity: 25 },
      { salesAreaId: terminal.id, productId: "015449", quantity: 5 },
      { salesAreaId: terminal.id, productId: "015450", quantity: 31 },
      { salesAreaId: terminal.id, productId: "015451", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015453", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015455", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015456", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015458", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015459", quantity: 6 },
      { salesAreaId: terminal.id, productId: "015460", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015461", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015467", quantity: 9 },
      { salesAreaId: terminal.id, productId: "015476", quantity: 13 },
      { salesAreaId: terminal.id, productId: "015489", quantity: 23 },
      { salesAreaId: terminal.id, productId: "015490", quantity: 16 },
      { salesAreaId: terminal.id, productId: "015524", quantity: 118 },
      { salesAreaId: terminal.id, productId: "015B067", quantity: 25 },
      { salesAreaId: terminal.id, productId: "0180175", quantity: 5 },
      { salesAreaId: terminal.id, productId: "0240029", quantity: 1 },
      { salesAreaId: terminal.id, productId: "0270032", quantity: 3 },
      { salesAreaId: terminal.id, productId: "02724511", quantity: 100 },
      { salesAreaId: terminal.id, productId: "015160", quantity: 9 },
      { salesAreaId: terminal.id, productId: "04400207", quantity: 5 },
      { salesAreaId: terminal.id, productId: "04400208", quantity: 9 },
      { salesAreaId: terminal.id, productId: "04400211", quantity: 17 },
      { salesAreaId: terminal.id, productId: "04400212", quantity: 5 },
      { salesAreaId: terminal.id, productId: "04400214", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015596", quantity: 145 },
      { salesAreaId: terminal.id, productId: "015614", quantity: 550 },
      { salesAreaId: terminal.id, productId: "02724583", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015487", quantity: 10 },
      { salesAreaId: terminal.id, productId: "015506", quantity: 4 },
      { salesAreaId: terminal.id, productId: "015584", quantity: 7 },
      { salesAreaId: terminal.id, productId: "015585", quantity: 6 },
      { salesAreaId: terminal.id, productId: "015586", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015591", quantity: 49 },
      { salesAreaId: terminal.id, productId: "0751008", quantity: 6 },
      { salesAreaId: terminal.id, productId: "0890344", quantity: 4 },
      { salesAreaId: terminal.id, productId: "04400224", quantity: 30 },
      { salesAreaId: terminal.id, productId: "0272426", quantity: 48 },
      { salesAreaId: terminal.id, productId: "015031", quantity: 10 },
      { salesAreaId: terminal.id, productId: "015516", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015536", quantity: 4 },
      { salesAreaId: terminal.id, productId: "015537", quantity: 5 },
      { salesAreaId: terminal.id, productId: "015538", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015558", quantity: 18 },
      { salesAreaId: terminal.id, productId: "015592", quantity: 1 },
      { salesAreaId: terminal.id, productId: "015593", quantity: 78 },
      { salesAreaId: terminal.id, productId: "015601", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015605", quantity: 2 },
      { salesAreaId: terminal.id, productId: "015610", quantity: 53 },
      { salesAreaId: terminal.id, productId: "015612", quantity: 42 },
      { salesAreaId: terminal.id, productId: "015613", quantity: 52 },
      { salesAreaId: terminal.id, productId: "015615", quantity: 16 },
      { salesAreaId: terminal.id, productId: "015618", quantity: 3 },
      { salesAreaId: terminal.id, productId: "015619", quantity: 12 },
      { salesAreaId: terminal.id, productId: "015620", quantity: 45 },
      { salesAreaId: terminal.id, productId: "015629", quantity: 4 },
      { salesAreaId: terminal.id, productId: "0204078", quantity: 6 },
      { salesAreaId: terminal.id, productId: "0272409", quantity: 50 },
      { salesAreaId: terminal.id, productId: "0272410", quantity: 77 },
      { salesAreaId: terminal.id, productId: "02724582", quantity: 31 },
      { salesAreaId: terminal.id, productId: "02724588", quantity: 2 },
      { salesAreaId: terminal.id, productId: "02724657", quantity: 5 },
      { salesAreaId: terminal.id, productId: "015359", quantity: 9 },
      { salesAreaId: terminal.id, productId: "015391", quantity: 15 },
      { salesAreaId: terminal.id, productId: "015583", quantity: 10 },
      { salesAreaId: terminal.id, productId: "015C075", quantity: 10 },
      { salesAreaId: terminal.id, productId: "02724559", quantity: 363 },
      { salesAreaId: terminal.id, productId: "02724561", quantity: 0 },
      { salesAreaId: terminal.id, productId: "040221", quantity: 41 },
      { salesAreaId: terminal.id, productId: "040495", quantity: 40 },
    ];

    const inventoryProductIds = terminalInventoryData.map((i) => i.productId);

    const existingProducts = await prisma.product.findMany({
      where: { id: { in: inventoryProductIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));

    const missingIds = inventoryProductIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      console.error("❌ Productos inexistentes en Product:", missingIds);
      throw new Error("Seed detenido por productos faltantes");
    }

    await prisma.salesAreaInventory.createMany({
      data: terminalInventoryData,
    });
  }

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
