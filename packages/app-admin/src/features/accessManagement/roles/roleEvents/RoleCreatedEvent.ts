import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { RoleCreatedEventHandler } from "./abstractions.js";

export interface RoleCreatedPayload {
    id: string;
}

/**
 * A role now exists that the admin's roles list may not have.
 *
 * Says nothing about where the news came from. The websocket is the source today
 * (`RoleWebsocketMessages`); anything else can publish it and the handlers stay as they are.
 */
export class RoleCreatedEvent extends BaseEvent<RoleCreatedPayload> {
    readonly eventType = "AccessManagement/RoleCreated" as const;

    getHandlerAbstraction() {
        return RoleCreatedEventHandler;
    }
}
