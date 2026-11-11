import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { TeamCreatedEventHandler } from "./abstractions.js";

export interface TeamCreatedPayload {
    id: string;
}

/**
 * A team now exists that the admin's teams list may not have.
 *
 * Says nothing about where the news came from. The websocket is the source today
 * (`TeamWebsocketMessages`); anything else can publish it and the handlers stay as they are.
 */
export class TeamCreatedEvent extends BaseEvent<TeamCreatedPayload> {
    readonly eventType = "AccessManagement/TeamCreated" as const;

    getHandlerAbstraction() {
        return TeamCreatedEventHandler;
    }
}
