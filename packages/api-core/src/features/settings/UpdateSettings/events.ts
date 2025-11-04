import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/abstractions.js";
import type { IEventHandler } from "~/features/eventPublisher/abstractions.js";
import type { SettingsBeforeUpdatePayload, SettingsAfterUpdatePayload } from "./abstractions.js";

export class SettingsBeforeUpdateEvent extends DomainEvent<SettingsBeforeUpdatePayload> {
    eventType = "settings.beforeUpdate" as const;

    getHandlerAbstraction() {
        return SettingsBeforeUpdateHandler;
    }
}

export const SettingsBeforeUpdateHandler = createAbstraction<
    IEventHandler<SettingsBeforeUpdateEvent>
>("SettingsBeforeUpdateHandler");

export namespace SettingsBeforeUpdateHandler {
    export type Interface = IEventHandler<SettingsBeforeUpdateEvent>;
    export type Event = SettingsBeforeUpdateEvent;
}

export class SettingsAfterUpdateEvent extends DomainEvent<SettingsAfterUpdatePayload> {
    eventType = "settings.afterUpdate" as const;

    getHandlerAbstraction() {
        return SettingsAfterUpdateHandler;
    }
}

export const SettingsAfterUpdateHandler = createAbstraction<
    IEventHandler<SettingsAfterUpdateEvent>
>("SettingsAfterUpdateHandler");

export namespace SettingsAfterUpdateHandler {
    export type Interface = IEventHandler<SettingsAfterUpdateEvent>;
    export type Event = SettingsAfterUpdateEvent;
}
