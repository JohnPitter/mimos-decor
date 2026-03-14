export type FinanceType = "PAYABLE" | "RECEIVABLE";
export type FinanceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
}

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  title: string;
  description: string | null;
  amount: number;
  categoryId: string;
  category?: FinanceCategory;
  dueDate: string;
  paidAt: string | null;
  status: FinanceStatus;
  isRecurring: boolean;
  recurringMonths: number | null;
  recurringGroupId: string | null;
  installmentNumber: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceEntryInput {
  type: FinanceType;
  title: string;
  description?: string;
  amount: number;
  categoryId: string;
  dueDate: string;
  isRecurring?: boolean;
  recurringMonths?: number;
}

export interface UpdateFinanceEntryInput {
  title?: string;
  description?: string;
  amount?: number;
  categoryId?: string;
  dueDate?: string;
}

export interface CreateFinanceCategoryInput {
  name: string;
  type: FinanceType;
  color: string;
  icon: string;
}

export interface UpdateFinanceCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface FinanceSummary {
  totalPayable: number;
  totalReceivable: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonth: number;
}

export interface FinanceNotifications {
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  total: number;
}
