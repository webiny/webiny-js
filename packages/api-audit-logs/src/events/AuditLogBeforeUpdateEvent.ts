import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { AuditLogBeforeUpdateHandler, AuditLogBeforeUpdatePayload } from "./abstractions.js";

export class AuditLogBeforeUpdateEvent extends DomainEvent<AuditLogBeforeUpdatePayload> {
    eventType = "auditLog.beforeUpdate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return AuditLogBeforeUpdateHandler;
    }
}
