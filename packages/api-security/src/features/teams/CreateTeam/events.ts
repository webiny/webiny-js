import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { TeamBeforeCreatePayload, TeamAfterCreatePayload } from "./abstractions.js";

export class TeamBeforeCreateEvent extends DomainEvent<TeamBeforeCreatePayload> {
    eventType = "team.beforeCreate" as const;

    getHandlerAbstraction() {
        return TeamBeforeCreateHandler;
    }
}

export const TeamBeforeCreateHandler = createAbstraction<IEventHandler<TeamBeforeCreateEvent>>(
    "TeamBeforeCreateHandler"
);

export class TeamAfterCreateEvent extends DomainEvent<TeamAfterCreatePayload> {
    eventType = "team.afterCreate" as const;

    getHandlerAbstraction() {
        return TeamAfterCreateHandler;
    }
}

export const TeamAfterCreateHandler = createAbstraction<IEventHandler<TeamAfterCreateEvent>>(
    "TeamAfterCreateHandler"
);
