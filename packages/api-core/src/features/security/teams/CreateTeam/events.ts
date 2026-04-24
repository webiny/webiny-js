import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { TeamBeforeCreatePayload, TeamAfterCreatePayload } from "./abstractions.js";

export class TeamBeforeCreateEvent extends DomainEvent<TeamBeforeCreatePayload> {
    eventType = "team.beforeCreate" as const;

    getHandlerAbstraction() {
        return TeamBeforeCreateEventHandler;
    }
}

/** Hook into team lifecycle before a team is created. */
export const TeamBeforeCreateEventHandler = createAbstraction<IEventHandler<TeamBeforeCreateEvent>>(
    "TeamBeforeCreateEventHandler"
);

export namespace TeamBeforeCreateEventHandler {
    export type Interface = IEventHandler<TeamBeforeCreateEvent>;
    export type Event = TeamBeforeCreateEvent;
}

export class TeamAfterCreateEvent extends DomainEvent<TeamAfterCreatePayload> {
    eventType = "team.afterCreate" as const;

    getHandlerAbstraction() {
        return TeamAfterCreateEventHandler;
    }
}

/** Hook into team lifecycle after a team is created. */
export const TeamAfterCreateEventHandler = createAbstraction<IEventHandler<TeamAfterCreateEvent>>(
    "TeamAfterCreateEventHandler"
);

export namespace TeamAfterCreateEventHandler {
    export type Interface = IEventHandler<TeamAfterCreateEvent>;
    export type Event = TeamAfterCreateEvent;
}
