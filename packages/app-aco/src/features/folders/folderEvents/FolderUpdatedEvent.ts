import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { FolderUpdatedEventHandler } from "./abstractions.js";

export interface FolderUpdatedPayload {
    id: string;
}

/**
 * A folder changed and the admin's cache may hold the old version. Like `FolderCreatedEvent`, it
 * says nothing about where the news came from.
 */
export class FolderUpdatedEvent extends BaseEvent<FolderUpdatedPayload> {
    readonly eventType = "Aco/FolderUpdated" as const;

    getHandlerAbstraction() {
        return FolderUpdatedEventHandler;
    }
}
