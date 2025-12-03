import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/abstractions.js";
import type { IEventHandler } from "~/features/eventPublisher/abstractions.js";
import type { SettingsBeforeDeletePayload, SettingsAfterDeletePayload } from "./abstractions.js";

export class SettingsBeforeDeleteEvent extends DomainEvent<SettingsBeforeDeletePayload> {
    eventType = "settings.beforeDelete" as const;

    getHandlerAbstraction() {
        return SettingsBeforeDeleteHandler;
    }
}

export const SettingsBeforeDeleteHandler = createAbstraction<
    IEventHandler<SettingsBeforeDeleteEvent>
>("SettingsBeforeDeleteHandler");

export namespace SettingsBeforeDeleteHandler {
    export type Interface = IEventHandler<SettingsBeforeDeleteEvent>;
    export type Event = SettingsBeforeDeleteEvent;
}

export class SettingsAfterDeleteEvent extends DomainEvent<SettingsAfterDeletePayload> {
    eventType = "settings.afterDelete" as const;

    getHandlerAbstraction() {
        return SettingsAfterDeleteHandler;
    }
}

export const SettingsAfterDeleteHandler = createAbstraction<
    IEventHandler<SettingsAfterDeleteEvent>
>("SettingsAfterDeleteHandler");

export namespace SettingsAfterDeleteHandler {
    export type Interface = IEventHandler<SettingsAfterDeleteEvent>;
    export type Event = SettingsAfterDeleteEvent;
}
