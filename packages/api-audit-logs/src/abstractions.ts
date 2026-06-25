import { createAbstraction } from "@webiny/feature/api";
import type { AuditLogsContext as IAuditLogsContext } from "~/types.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";

// NOTE: this token is registered with (and used as) the full audit-logs request context —
// handlers resolve it for `.container` and pass it to getAuditConfig. The interface must
// therefore be the context, not the AuditLogsContextValue facade. The proper fix (drop the
// whole-context injection in favour of an `AuditLogs` facade token + removing context.auditLogs)
// is the context-removal migration, tracked separately.
export const AuditLogsContext = createAbstraction<IAuditLogsContext>("AuditLogsContext");

export namespace AuditLogsContext {
    export type Interface = IAuditLogsContext;
}

export const AuditLogsStorage = createAbstraction<IStorage>("AuditLogsStorage");

export namespace AuditLogsStorage {
    export type Interface = IStorage;
}
