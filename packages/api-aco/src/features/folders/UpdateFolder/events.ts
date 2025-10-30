import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { FolderBeforeUpdateHandler, FolderAfterUpdateHandler } from "./abstractions.js";
import type { FolderBeforeUpdatePayload, FolderAfterUpdatePayload } from "./abstractions.js";

// FolderBeforeUpdate Event
export class FolderBeforeUpdateEvent extends DomainEvent<FolderBeforeUpdatePayload> {
    eventType = "folder.beforeUpdate" as const;

    getHandlerAbstraction() {
        return FolderBeforeUpdateHandler;
    }
}

// FolderAfterUpdate Event
export class FolderAfterUpdateEvent extends DomainEvent<FolderAfterUpdatePayload> {
    eventType = "folder.afterUpdate" as const;

    getHandlerAbstraction() {
        return FolderAfterUpdateHandler;
    }
}
