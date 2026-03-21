export interface Supply {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  unit: string;
  supplier: string | null;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyInput {
  name: string;
  description?: string;
  unitPrice: number;
  quantity?: number;
  unit?: string;
  supplier?: string;
  minStock?: number;
}

export interface UpdateSupplyInput {
  name?: string;
  description?: string;
  unitPrice?: number;
  quantity?: number;
  unit?: string;
  supplier?: string;
  minStock?: number;
}
