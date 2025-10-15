import { Abstraction } from "@webiny/di-container";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import { FolderBeforeUpdateHandler, FolderAfterUpdateHandler } from "./abstractions.js";
import type { FolderBeforeUpdatePayload, FolderAfterUpdatePayload } from "./abstractions.js";

// FolderBeforeUpdate Event
export class FolderBeforeUpdateEvent implements DomainEvent<FolderBeforeUpdatePayload> {
    eventType = "folder.beforeUpdate" as const;
    occurredAt: Date;

    constructor(public payload: FolderBeforeUpdatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderBeforeUpdateHandler;
    }
}

// FolderAfterUpdate Event
export class FolderAfterUpdateEvent implements DomainEvent<FolderAfterUpdatePayload> {
    eventType = "folder.afterUpdate" as const;
    occurredAt: Date;

    constructor(public payload: FolderAfterUpdatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderAfterUpdateHandler;
    }
}
