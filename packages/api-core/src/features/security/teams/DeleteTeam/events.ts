import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
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

export namespace TeamBeforeDeleteHandler {
    export type Interface = IEventHandler<TeamBeforeDeleteEvent>;
    export type Event = TeamBeforeDeleteEvent;
}

export class TeamAfterDeleteEvent extends DomainEvent<TeamAfterDeletePayload> {
    eventType = "team.afterDelete" as const;

    getHandlerAbstraction() {
        return TeamAfterDeleteHandler;
    }
}

export const TeamAfterDeleteHandler = createAbstraction<IEventHandler<TeamAfterDeleteEvent>>(
    "TeamAfterDeleteHandler"
);

export namespace TeamAfterDeleteHandler {
    export type Interface = IEventHandler<TeamAfterDeleteEvent>;
    export type Event = TeamAfterDeleteEvent;
}
