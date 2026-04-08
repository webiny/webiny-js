import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IAuditLog } from "~/storage/types.js";
import type { AuditLogsContext } from "~/types.js";

// ============================================================================
// AuditLogBeforeCreate Event
// ============================================================================

export interface AuditLogBeforeCreatePayload {
    auditLog: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}

export const AuditLogBeforeCreateHandler = createAbstraction<
    IEventHandler<DomainEvent<AuditLogBeforeCreatePayload>>
>("AuditLogBeforeCreateHandler");

export namespace AuditLogBeforeCreateHandler {
    export type Interface = IEventHandler<DomainEvent<AuditLogBeforeCreatePayload>>;
    export type Event = DomainEvent<AuditLogBeforeCreatePayload>;
}

// ============================================================================
// AuditLogAfterCreate Event
// ============================================================================

export interface AuditLogAfterCreatePayload {
    auditLog: IAuditLog;
    context: AuditLogsContext;
}

export const AuditLogAfterCreateHandler = createAbstraction<
    IEventHandler<DomainEvent<AuditLogAfterCreatePayload>>
>("AuditLogAfterCreateHandler");

export namespace AuditLogAfterCreateHandler {
    export type Interface = IEventHandler<DomainEvent<AuditLogAfterCreatePayload>>;
    export type Event = DomainEvent<AuditLogAfterCreatePayload>;
}

// ============================================================================
// AuditLogBeforeUpdate Event
// ============================================================================

export interface AuditLogBeforeUpdatePayload {
    auditLog: IAuditLog;
    original: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}

export const AuditLogBeforeUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<AuditLogBeforeUpdatePayload>>
>("AuditLogBeforeUpdateHandler");

export namespace AuditLogBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<AuditLogBeforeUpdatePayload>>;
    export type Event = DomainEvent<AuditLogBeforeUpdatePayload>;
}

// ============================================================================
// AuditLogAfterUpdate Event
// ============================================================================

export interface AuditLogAfterUpdatePayload {
    auditLog: IAuditLog;
    original: IAuditLog;
    context: AuditLogsContext;
}

export const AuditLogAfterUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<AuditLogAfterUpdatePayload>>
>("AuditLogAfterUpdateHandler");

export namespace AuditLogAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<AuditLogAfterUpdatePayload>>;
    export type Event = DomainEvent<AuditLogAfterUpdatePayload>;
}
