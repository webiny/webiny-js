import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { TeamBeforeUpdatePayload, TeamAfterUpdatePayload } from "./abstractions.js";

export class TeamBeforeUpdateEvent extends DomainEvent<TeamBeforeUpdatePayload> {
    eventType = "team.beforeUpdate" as const;

    getHandlerAbstraction() {
        return TeamBeforeUpdateHandler;
    }
}

export const TeamBeforeUpdateHandler = createAbstraction<IEventHandler<TeamBeforeUpdateEvent>>(
    "TeamBeforeUpdateHandler"
);

export class TeamAfterUpdateEvent extends DomainEvent<TeamAfterUpdatePayload> {
    eventType = "team.afterUpdate" as const;

    getHandlerAbstraction() {
        return TeamAfterUpdateHandler;
    }
}

export const TeamAfterUpdateHandler = createAbstraction<IEventHandler<TeamAfterUpdateEvent>>(
    "TeamAfterUpdateHandler"
);
