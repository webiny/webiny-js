import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { FolderDeletedEventHandler } from "./abstractions.js";

export interface FolderDeletedPayload {
    id: string;
}

/** A folder no longer exists, and the admin's cache may still hold it. */
export class FolderDeletedEvent extends BaseEvent<FolderDeletedPayload> {
    readonly eventType = "Aco/FolderDeleted" as const;

    getHandlerAbstraction() {
        return FolderDeletedEventHandler;
    }
}
