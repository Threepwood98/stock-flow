-- Add storeId column as nullable first
ALTER TABLE "Product" ADD COLUMN "storeId" TEXT;

-- Get the store ID for "Los Bebitos" and update all products
UPDATE "Product" 
SET "storeId" = (SELECT id FROM "Store" WHERE name = 'Los Bebitos' LIMIT 1)
WHERE "storeId" IS NULL;

-- Make storeId NOT NULL (now that all products have a value)
ALTER TABLE "Product" ALTER COLUMN "storeId" SET NOT NULL;

-- Create index for storeId
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- Add foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" 
FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
