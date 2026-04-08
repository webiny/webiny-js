import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { AuditLogAfterCreateHandler, AuditLogAfterCreatePayload } from "./abstractions.js";

export class AuditLogAfterCreateEvent extends DomainEvent<AuditLogAfterCreatePayload> {
    eventType = "auditLog.afterCreate" as const;

    getHandlerAbstraction() {
        return AuditLogAfterCreateHandler;
    }
}
