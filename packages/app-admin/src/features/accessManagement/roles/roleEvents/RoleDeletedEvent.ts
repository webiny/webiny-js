import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { RoleDeletedEventHandler } from "./abstractions.js";

export interface RoleDeletedPayload {
    id: string;
}

/** A role no longer exists, and the admin's roles list may still hold it. */
export class RoleDeletedEvent extends BaseEvent<RoleDeletedPayload> {
    readonly eventType = "AccessManagement/RoleDeleted" as const;

    getHandlerAbstraction() {
        return RoleDeletedEventHandler;
    }
}
