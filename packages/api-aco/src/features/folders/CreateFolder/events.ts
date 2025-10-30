import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { FolderBeforeCreateHandler, FolderAfterCreateHandler } from "./abstractions.js";
import type { FolderBeforeCreatePayload, FolderAfterCreatePayload } from "./abstractions.js";

// FolderBeforeCreate Event
export class FolderBeforeCreateEvent extends DomainEvent<FolderBeforeCreatePayload> {
    eventType = "folder.beforeCreate" as const;

    getHandlerAbstraction() {
        return FolderBeforeCreateHandler;
    }
}

// FolderAfterCreate Event
export class FolderAfterCreateEvent extends DomainEvent<FolderAfterCreatePayload> {
    eventType = "folder.afterCreate" as const;

    getHandlerAbstraction() {
        return FolderAfterCreateHandler;
    }
}
