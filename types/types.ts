export interface Warehouse {
  id: string;
  name: string;
  warehouseInventories: WarehouseInventory[];
}

export interface Provider {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  warehouseId: string;
  costPrice: { d: number };
  salePrice: { d: number };
  unit: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface WarehouseInventory {
  id: string;
  quantity: number;
  product: Product;
}

export interface Destination {
  id: string;
  name: string;
}

export interface SalesAreaInventory {
  id: string;
  quantity: number;
  product: Product;
}

export interface SaleArea {
  id: string;
  name: string;
  salesAreaInventories: SalesAreaInventory[];
}

export interface Sale {
  id: string;
  date: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  saleAmount: number;
  costAmount: number;
  profit: number;
  payMethod: string;
  salesAreaId: string;
  salesAreaName: string;
  storeId: string;
  storeName: string;
  userId: string;
  userName: string;
}

export interface UserStores {
  storeId: string;
  store: {
    id: string;
    name: string;
  };
}

export interface OutletContext {
  user: any;
  warehouses: Warehouse[];
  salesAreas: SaleArea[];
  providers: {
    companies: Provider[];
    stores: Provider[];
  };
  destinations: {
    stores: Destination[];
    salesAreas: Destination[];
  };
  products: Product[];
  categories: Category[];
  sales: Sale[];
  userStores: UserStores[];
}
