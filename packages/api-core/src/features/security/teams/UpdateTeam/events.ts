import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { TeamBeforeUpdatePayload, TeamAfterUpdatePayload } from "./abstractions.js";

export class TeamBeforeUpdateEvent extends DomainEvent<TeamBeforeUpdatePayload> {
    eventType = "team.beforeUpdate" as const;

    getHandlerAbstraction() {
        return TeamBeforeUpdateEventHandler;
    }
}

export const TeamBeforeUpdateEventHandler =
    createAbstraction<IEventHandler<TeamBeforeUpdateEvent>>("TeamBeforeUpdateEventHandler");

export namespace TeamBeforeUpdateEventHandler {
    export type Interface = IEventHandler<TeamBeforeUpdateEvent>;
    export type Event = TeamBeforeUpdateEvent;
}

export class TeamAfterUpdateEvent extends DomainEvent<TeamAfterUpdatePayload> {
    eventType = "team.afterUpdate" as const;

    getHandlerAbstraction() {
        return TeamAfterUpdateEventHandler;
    }
}

export const TeamAfterUpdateEventHandler =
    createAbstraction<IEventHandler<TeamAfterUpdateEvent>>("TeamAfterUpdateEventHandler");

export namespace TeamAfterUpdateEventHandler {
    export type Interface = IEventHandler<TeamAfterUpdateEvent>;
    export type Event = TeamAfterUpdateEvent;
}
