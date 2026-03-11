import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { useAuditStore } from "../stores/audit.store.js";
import { useUserStore } from "../stores/user.store.js";
import type { AuditAction, AuditEntity, AuditLog } from "@mimos/shared";

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Criou",
  UPDATE: "Editou",
  DELETE: "Removeu",
};

const ENTITY_LABELS: Record<AuditEntity, string> = {
  PRODUCT: "Produto",
  SALE: "Venda",
  USER: "Usuario",
};

const ACTION_ICONS: Record<AuditAction, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-600",
  UPDATE: "bg-blue-100 text-blue-600",
  DELETE: "bg-red-100 text-red-500",
};

export default function AuditLogs() {
  const { logs, total, loading, fetchLogs } = useAuditStore();
  const { users, fetchUsers } = useUserStore();
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLogs({
      userId: userId || undefined,
      action: (action as AuditAction) || undefined,
      entity: (entity as AuditEntity) || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
    });
  }, [page, userId, action, entity, startDate, endDate, fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const resetFilters = () => {
    setUserId("");
    setAction("");
    setEntity("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = userId || action || entity || startDate || endDate;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Auditoria" />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Filters */}
        <div className="bg-card-bg rounded-xl border border-stroke p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Usuario</label>
              <select
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Acao</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Todas</option>
                <option value="CREATE">Criar</option>
                <option value="UPDATE">Editar</option>
                <option value="DELETE">Remover</option>
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Entidade</label>
              <select
                value={entity}
                onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Todas</option>
                <option value="PRODUCT">Produto</option>
                <option value="SALE">Venda</option>
                <option value="USER">Usuario</option>
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">De</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Ate</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-[13px] text-text-muted hover:text-text-dark border border-stroke rounded-lg hover:bg-page-bg transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Results info */}
        <p className="text-[13px] text-text-muted mb-4">
          {total} {total === 1 ? "registro" : "registros"} encontrado{total !== 1 ? "s" : ""}
        </p>

        {/* Timeline */}
        {loading && logs.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-card-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <ScrollText size={48} className="mb-4 opacity-40" />
            <p className="text-[15px] font-medium">Nenhum registro encontrado</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-2 text-[13px] text-primary hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <LogEntry
                key={log.id}
                log={log}
                expanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-[13px] rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-[13px] text-text-muted px-3">
              {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-[13px] rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Proximo
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function LogEntry({ log, expanded, onToggle }: { log: AuditLog; expanded: boolean; onToggle: () => void }) {
  const Icon = ACTION_ICONS[log.action];
  const colorClass = ACTION_COLORS[log.action];
  const hasDetails = log.oldData || log.newData;

  return (
    <div className="bg-card-bg rounded-xl border border-stroke overflow-hidden hover:shadow-sm transition-all">
      <button
        onClick={hasDetails ? onToggle : undefined}
        className={`w-full flex items-center gap-4 px-5 py-3.5 text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-text-dark">
            <span className="font-semibold">{log.userName}</span>
            {" "}{ACTION_LABELS[log.action].toLowerCase()}{" "}
            <span className="font-medium">{ENTITY_LABELS[log.entity]}</span>
            <span className="text-text-muted"> #{log.entityId.slice(0, 8)}</span>
          </p>
          <p className="text-[12px] text-text-muted mt-0.5">
            {new Date(log.createdAt).toLocaleDateString("pt-BR")}{" "}
            {new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {hasDetails && (
          <div className="text-text-muted shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-5 pb-4 border-t border-stroke pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.oldData && (
              <div>
                <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-2">Dados Anteriores</p>
                <DataView data={log.oldData} diffWith={log.newData} type="old" />
              </div>
            )}
            {log.newData && (
              <div>
                <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-2">Dados Novos</p>
                <DataView data={log.newData} diffWith={log.oldData} type="new" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DataView({
  data,
  diffWith,
  type,
}: {
  data: Record<string, unknown>;
  diffWith: Record<string, unknown> | null;
  type: "old" | "new";
}) {
  const entries = Object.entries(data);

  return (
    <div className="bg-page-bg rounded-lg border border-stroke p-3 text-[12px] font-mono space-y-1 max-h-[300px] overflow-y-auto">
      {entries.map(([key, value]) => {
        const changed = diffWith ? JSON.stringify(diffWith[key]) !== JSON.stringify(value) : false;
        const highlightClass = changed
          ? type === "old"
            ? "bg-red-50 text-red-700"
            : "bg-green-50 text-green-700"
          : "text-text-muted";

        return (
          <div key={key} className={`px-2 py-0.5 rounded ${highlightClass}`}>
            <span className="text-text-dark font-semibold">{key}:</span>{" "}
            {formatValue(value)}
          </div>
        );
      })}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
