import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { TeamBeforeDeletePayload, TeamAfterDeletePayload } from "./abstractions.js";

export class TeamBeforeDeleteEvent extends DomainEvent<TeamBeforeDeletePayload> {
    eventType = "team.beforeDelete" as const;

    getHandlerAbstraction() {
        return TeamBeforeDeleteEventHandler;
    }
}

export const TeamBeforeDeleteEventHandler =
    createAbstraction<IEventHandler<TeamBeforeDeleteEvent>>("TeamBeforeDeleteEventHandler");

export namespace TeamBeforeDeleteEventHandler {
    export type Interface = IEventHandler<TeamBeforeDeleteEvent>;
    export type Event = TeamBeforeDeleteEvent;
}

export class TeamAfterDeleteEvent extends DomainEvent<TeamAfterDeletePayload> {
    eventType = "team.afterDelete" as const;

    getHandlerAbstraction() {
        return TeamAfterDeleteEventHandler;
    }
}

export const TeamAfterDeleteEventHandler =
    createAbstraction<IEventHandler<TeamAfterDeleteEvent>>("TeamAfterDeleteEventHandler");

export namespace TeamAfterDeleteEventHandler {
    export type Interface = IEventHandler<TeamAfterDeleteEvent>;
    export type Event = TeamAfterDeleteEvent;
}
