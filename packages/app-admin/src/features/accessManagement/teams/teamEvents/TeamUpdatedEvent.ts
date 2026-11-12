import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { TeamUpdatedEventHandler } from "./abstractions.js";

export interface TeamUpdatedPayload {
    id: string;
}

/** A team changed, and the admin's teams list may still hold the old copy. */
export class TeamUpdatedEvent extends BaseEvent<TeamUpdatedPayload> {
    readonly eventType = "AccessManagement/TeamUpdated" as const;

    getHandlerAbstraction() {
        return TeamUpdatedEventHandler;
    }
}
