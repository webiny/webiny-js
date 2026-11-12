import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { TeamDeletedEventHandler } from "./abstractions.js";

export interface TeamDeletedPayload {
    id: string;
}

/** A team no longer exists, and the admin's teams list may still hold it. */
export class TeamDeletedEvent extends BaseEvent<TeamDeletedPayload> {
    readonly eventType = "AccessManagement/TeamDeleted" as const;

    getHandlerAbstraction() {
        return TeamDeletedEventHandler;
    }
}
