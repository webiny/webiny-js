import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { AuditLogAfterCreateHandler, AuditLogAfterCreatePayload } from "./abstractions.js";

export class AuditLogAfterCreateEvent extends DomainEvent<AuditLogAfterCreatePayload> {
    eventType = "auditLog.afterCreate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return AuditLogAfterCreateHandler;
    }
}
