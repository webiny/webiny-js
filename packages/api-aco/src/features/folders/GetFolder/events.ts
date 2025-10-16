import type { Abstraction } from "@webiny/di-container";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import { FolderBeforeGetHandler, FolderAfterGetHandler } from "./abstractions.js";
import type { FolderBeforeGetPayload, FolderAfterGetPayload } from "./abstractions.js";

// FolderBeforeGet Event
export class FolderBeforeGetEvent implements DomainEvent<FolderBeforeGetPayload> {
    eventType = "folder.beforeGet" as const;
    occurredAt: Date;

    constructor(public payload: FolderBeforeGetPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderBeforeGetHandler;
    }
}

// FolderAfterGet Event
export class FolderAfterGetEvent implements DomainEvent<FolderAfterGetPayload> {
    eventType = "folder.afterGet" as const;
    occurredAt: Date;

    constructor(public payload: FolderAfterGetPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return FolderAfterGetHandler;
    }
}
