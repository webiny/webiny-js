import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { RoleUpdatedEventHandler } from "./abstractions.js";

export interface RoleUpdatedPayload {
    id: string;
}

/** A role changed, and the admin's roles list may still hold the old copy. */
export class RoleUpdatedEvent extends BaseEvent<RoleUpdatedPayload> {
    readonly eventType = "AccessManagement/RoleUpdated" as const;

    getHandlerAbstraction() {
        return RoleUpdatedEventHandler;
    }
}
