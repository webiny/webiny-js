import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { TeamBeforeDeletePayload, TeamAfterDeletePayload } from "./abstractions.js";

export class TeamBeforeDeleteEvent extends DomainEvent<TeamBeforeDeletePayload> {
    eventType = "team.beforeDelete" as const;

    getHandlerAbstraction() {
        return TeamBeforeDeleteHandler;
    }
}

export const TeamBeforeDeleteHandler = createAbstraction<IEventHandler<TeamBeforeDeleteEvent>>(
    "TeamBeforeDeleteHandler"
);

export class TeamAfterDeleteEvent extends DomainEvent<TeamAfterDeletePayload> {
    eventType = "team.afterDelete" as const;

    getHandlerAbstraction() {
        return TeamAfterDeleteHandler;
    }
}

export const TeamAfterDeleteHandler = createAbstraction<IEventHandler<TeamAfterDeleteEvent>>(
    "TeamAfterDeleteHandler"
);
