export interface PhoneInput {
  number: string;
  isPrimary: boolean;
}

export interface WarehouseInput {
  name: string;
}

export interface SalesAreaInput {
  name: string;
}

export interface StoreInput {
  name: string;
  warehouses: WarehouseInput[];
  salesAreas: SalesAreaInput[];
}

export interface CompleteRegistrationData {
  phones: PhoneInput[];
  stores: StoreInput[];
}
