import type { Abstraction } from "@webiny/di-container";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import { FolderBeforeCreateHandler, FolderAfterCreateHandler } from "./abstractions.js";
import type { FolderBeforeCreatePayload, FolderAfterCreatePayload } from "./abstractions.js";

// FolderBeforeCreate Event
export class FolderBeforeCreateEvent implements DomainEvent<FolderBeforeCreatePayload> {
    eventType = "folder.beforeCreate" as const;
    occurredAt: Date;

    constructor(public payload: FolderBeforeCreatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderBeforeCreateHandler;
    }
}

// FolderAfterCreate Event
export class FolderAfterCreateEvent implements DomainEvent<FolderAfterCreatePayload> {
    eventType = "folder.afterCreate" as const;
    occurredAt: Date;

    constructor(public payload: FolderAfterCreatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderAfterCreateHandler;
    }
}
