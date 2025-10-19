import { DomainEvent } from "@webiny/api-core";
import { FolderBeforeDeleteHandler, FolderAfterDeleteHandler } from "./abstractions.js";
import type { FolderBeforeDeletePayload, FolderAfterDeletePayload } from "./abstractions.js";

// FolderBeforeDelete Event
export class FolderBeforeDeleteEvent extends DomainEvent<FolderBeforeDeletePayload> {
    eventType = "folder.beforeDelete" as const;

    getHandlerAbstraction() {
        return FolderBeforeDeleteHandler;
    }
}

// FolderAfterDelete Event
export class FolderAfterDeleteEvent extends DomainEvent<FolderAfterDeletePayload> {
    eventType = "folder.afterDelete" as const;

    getHandlerAbstraction() {
        return FolderAfterDeleteHandler;
    }
}
