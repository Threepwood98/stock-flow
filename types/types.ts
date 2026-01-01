export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role?: string | null;
  profileCompleted?: boolean | null;
}

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
  categoryId: string;
  name: string;
  warehouseId: string;
  costPrice: number;
  salePrice: number;
  unit: string;
}

export interface Category {
  id: string;
  generalCategoryId: string;
  name: string;
}

export interface WarehouseInventory {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
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

export interface Inflow {
  id: string;
  userId: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  inType: string;
  providerCompanyId: string;
  providerStoreId: string;
  providerName: string;
  payMethod: string;
  invoiceNumber: string;
  inNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  costAmount: number;
  saleAmount: number;
}

export interface Outflow {
  id: string;
  userId: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  outType: string;
  destinationStoreId: string;
  destinationSalesAreaId: string;
  destinationName: string;
  payMethod: string;
  outNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  costAmount: number;
  saleAmount: number;
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

export interface Withdraw {
  id: string;
  date: string;
  amount: number;
  salesAreaId: string;
  salesAreaName: string;
  storeId: string;
  storeName: string;
  userId: string;
  userName: string;
  createdAt: string;
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
  inflows: Inflow[];
  outflows: Outflow[];
  sales: Sale[];
  withdraws: Withdraw[];
  userStores: UserStores[];
}
