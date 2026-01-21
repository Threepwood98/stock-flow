-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movementNumber" TEXT NOT NULL,
    "sourceSalesAreaId" TEXT NOT NULL,
    "destinationWarehouseId" TEXT,
    "destinationSalesAreaId" TEXT,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "costAmount" DECIMAL(18,2) NOT NULL,
    "saleAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movement_userId_idx" ON "Movement"("userId");

-- CreateIndex
CREATE INDEX "Movement_movementType_idx" ON "Movement"("movementType");

-- CreateIndex
CREATE INDEX "Movement_sourceSalesAreaId_idx" ON "Movement"("sourceSalesAreaId");

-- CreateIndex
CREATE INDEX "Movement_destinationWarehouseId_idx" ON "Movement"("destinationWarehouseId");

-- CreateIndex
CREATE INDEX "Movement_destinationSalesAreaId_idx" ON "Movement"("destinationSalesAreaId");

-- CreateIndex
CREATE INDEX "Movement_productId_idx" ON "Movement"("productId");

-- CreateIndex
CREATE INDEX "Movement_date_idx" ON "Movement"("date");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_sourceSalesAreaId_fkey" FOREIGN KEY ("sourceSalesAreaId") REFERENCES "SalesArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_destinationSalesAreaId_fkey" FOREIGN KEY ("destinationSalesAreaId") REFERENCES "SalesArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
