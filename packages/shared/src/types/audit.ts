export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntity = "PRODUCT" | "SALE" | "USER";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
