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

export namespace TeamBeforeCreateHandler {
    export type Interface = IEventHandler<TeamBeforeCreateEvent>;
    export type Event = TeamBeforeCreateEvent;
}

export class TeamAfterCreateEvent extends DomainEvent<TeamAfterCreatePayload> {
    eventType = "team.afterCreate" as const;

    getHandlerAbstraction() {
        return TeamAfterCreateHandler;
    }
}

export const TeamAfterCreateHandler = createAbstraction<IEventHandler<TeamAfterCreateEvent>>(
    "TeamAfterCreateHandler"
);

export namespace TeamAfterCreateHandler {
    export type Interface = IEventHandler<TeamAfterCreateEvent>;
    export type Event = TeamAfterCreateEvent;
}
