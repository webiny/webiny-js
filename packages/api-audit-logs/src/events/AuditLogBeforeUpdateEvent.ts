import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { AuditLogBeforeUpdateHandler, AuditLogBeforeUpdatePayload } from "./abstractions.js";

export class AuditLogBeforeUpdateEvent extends DomainEvent<AuditLogBeforeUpdatePayload> {
    eventType = "auditLog.beforeUpdate" as const;

    getHandlerAbstraction() {
        return AuditLogBeforeUpdateHandler;
    }
}
