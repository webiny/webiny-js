import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { FolderBeforeGetHandler, FolderAfterGetHandler } from "./abstractions.js";
import type { FolderBeforeGetPayload, FolderAfterGetPayload } from "./abstractions.js";

// FolderBeforeGet Event
export class FolderBeforeGetEvent extends DomainEvent<FolderBeforeGetPayload> {
    eventType = "folder.beforeGet" as const;

    getHandlerAbstraction() {
        return FolderBeforeGetHandler;
    }
}

// FolderAfterGet Event
export class FolderAfterGetEvent extends DomainEvent<FolderAfterGetPayload> {
    eventType = "folder.afterGet" as const;

    getHandlerAbstraction() {
        return FolderAfterGetHandler;
    }
}
