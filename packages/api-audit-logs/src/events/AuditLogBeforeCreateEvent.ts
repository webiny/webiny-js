import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { AuditLogBeforeCreateHandler, AuditLogBeforeCreatePayload } from "./abstractions.js";

export class AuditLogBeforeCreateEvent extends DomainEvent<AuditLogBeforeCreatePayload> {
    eventType = "auditLog.beforeCreate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return AuditLogBeforeCreateHandler;
    }
}
