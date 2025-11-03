import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { TeamBeforeUpdatePayload, TeamAfterUpdatePayload } from "./abstractions.js";

export class TeamBeforeUpdateEvent extends DomainEvent<TeamBeforeUpdatePayload> {
    eventType = "team.beforeUpdate" as const;

    getHandlerAbstraction() {
        return TeamBeforeUpdateHandler;
    }
}

export const TeamBeforeUpdateHandler =
    createAbstraction<IEventHandler<TeamBeforeUpdateEvent>>("TeamBeforeUpdateHandler");

export namespace TeamBeforeUpdateHandler {
    export type Interface = IEventHandler<TeamBeforeUpdateEvent>;
    export type Event = TeamBeforeUpdateEvent;
}

export class TeamAfterUpdateEvent extends DomainEvent<TeamAfterUpdatePayload> {
    eventType = "team.afterUpdate" as const;

    getHandlerAbstraction() {
        return TeamAfterUpdateHandler;
    }
}

export const TeamAfterUpdateHandler =
    createAbstraction<IEventHandler<TeamAfterUpdateEvent>>("TeamAfterUpdateHandler");

export namespace TeamAfterUpdateHandler {
    export type Interface = IEventHandler<TeamAfterUpdateEvent>;
    export type Event = TeamAfterUpdateEvent;
}
