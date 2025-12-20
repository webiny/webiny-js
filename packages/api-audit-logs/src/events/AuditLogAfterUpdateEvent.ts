import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { AuditLogAfterUpdateHandler, AuditLogAfterUpdatePayload } from "./abstractions.js";

export class AuditLogAfterUpdateEvent extends DomainEvent<AuditLogAfterUpdatePayload> {
    eventType = "auditLog.afterUpdate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return AuditLogAfterUpdateHandler;
    }
}
