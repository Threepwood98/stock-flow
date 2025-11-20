-- CreateTable
CREATE TABLE "tiendas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almacenes" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_venta" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "areas_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio_costo" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "unidad_medida" TEXT NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proveedor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas_almacen" (
    "id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor_id" TEXT,
    "metodo_pago" TEXT,
    "num_factura_o_traslado" TEXT,
    "num_consecutivo" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "entradas_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_extra" (
    "id" TEXT NOT NULL,
    "area_venta_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "caja_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salidas_almacen" (
    "id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destino_area_id" TEXT,
    "destino_tienda_id" TEXT,
    "num_vale_o_traslado" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "importe" DECIMAL(10,2),

    CONSTRAINT "salidas_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_area" (
    "id" TEXT NOT NULL,
    "area_venta_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_pago" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ventas_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_factura" (
    "id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_pago" TEXT NOT NULL,
    "num_venta_factura" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "empresa_id" TEXT,

    CONSTRAINT "ventas_factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_area_nombre_tienda" ON "areas_venta"("nombre", "tienda_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_nombre_key" ON "cuentas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_nombre_key" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");

-- AddForeignKey
ALTER TABLE "almacenes" ADD CONSTRAINT "almacenes_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "areas_venta" ADD CONSTRAINT "areas_venta_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entradas_almacen" ADD CONSTRAINT "entradas_almacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entradas_almacen" ADD CONSTRAINT "entradas_almacen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entradas_almacen" ADD CONSTRAINT "entradas_almacen_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "caja_extra" ADD CONSTRAINT "caja_extra_area_venta_id_fkey" FOREIGN KEY ("area_venta_id") REFERENCES "areas_venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salidas_almacen" ADD CONSTRAINT "salidas_almacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salidas_almacen" ADD CONSTRAINT "salidas_almacen_destino_area_id_fkey" FOREIGN KEY ("destino_area_id") REFERENCES "areas_venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salidas_almacen" ADD CONSTRAINT "salidas_almacen_destino_tienda_id_fkey" FOREIGN KEY ("destino_tienda_id") REFERENCES "tiendas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salidas_almacen" ADD CONSTRAINT "salidas_almacen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas_area" ADD CONSTRAINT "ventas_area_area_venta_id_fkey" FOREIGN KEY ("area_venta_id") REFERENCES "areas_venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas_area" ADD CONSTRAINT "ventas_area_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas_factura" ADD CONSTRAINT "ventas_factura_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas_factura" ADD CONSTRAINT "ventas_factura_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas_factura" ADD CONSTRAINT "ventas_factura_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
