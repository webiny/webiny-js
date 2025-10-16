import type { Abstraction } from "@webiny/di-container";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import { FolderBeforeDeleteHandler, FolderAfterDeleteHandler } from "./abstractions.js";
import type { FolderBeforeDeletePayload, FolderAfterDeletePayload } from "./abstractions.js";

// FolderBeforeDelete Event
export class FolderBeforeDeleteEvent implements DomainEvent<FolderBeforeDeletePayload> {
    eventType = "folder.beforeDelete" as const;
    occurredAt: Date;

    constructor(public payload: FolderBeforeDeletePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderBeforeDeleteHandler;
    }
}

// FolderAfterDelete Event
export class FolderAfterDeleteEvent implements DomainEvent<FolderAfterDeletePayload> {
    eventType = "folder.afterDelete" as const;
    occurredAt: Date;

    constructor(public payload: FolderAfterDeletePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderAfterDeleteHandler;
    }
}
