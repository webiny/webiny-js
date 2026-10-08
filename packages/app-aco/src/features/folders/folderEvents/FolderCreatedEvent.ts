import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { FolderCreatedEventHandler } from "./abstractions.js";

export interface FolderCreatedPayload {
    id: string;
}

/**
 * A folder now exists that the admin's cache may not have.
 *
 * Deliberately says nothing about where the news came from. The websocket is one source today; the
 * palette or a background task can publish the same event, and the handlers do not change.
 */
export class FolderCreatedEvent extends BaseEvent<FolderCreatedPayload> {
    readonly eventType = "Aco/FolderCreated" as const;

    getHandlerAbstraction() {
        return FolderCreatedEventHandler;
    }
}
