import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import type { UpdateSettingsInput } from "~/domain/settings/types.js";

// ============================================================================
// SettingsBeforeUpdate Event
// ============================================================================

export interface SettingsBeforeUpdatePayload {
    original: FileManagerSettings;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

export class SettingsBeforeUpdateEvent extends DomainEvent<SettingsBeforeUpdatePayload> {
    eventType = "FileManager/Settings/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return SettingsBeforeUpdateHandler;
    }
}

export const SettingsBeforeUpdateHandler =
    createAbstraction<IEventHandler<SettingsBeforeUpdateEvent>>("SettingsBeforeUpdateHandler");

export namespace SettingsBeforeUpdateHandler {
    export type Interface = IEventHandler<SettingsBeforeUpdateEvent>;
    export type Event = SettingsBeforeUpdateEvent;
}

// ============================================================================
// SettingsAfterUpdate Event
// ============================================================================

export interface SettingsAfterUpdatePayload {
    original: FileManagerSettings;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

export class SettingsAfterUpdateEvent extends DomainEvent<SettingsAfterUpdatePayload> {
    eventType = "FileManager/Settings/AfterUpdate" as const;

    getHandlerAbstraction() {
        return SettingsAfterUpdateHandler;
    }
}

export const SettingsAfterUpdateHandler =
    createAbstraction<IEventHandler<SettingsAfterUpdateEvent>>("SettingsAfterUpdateHandler");

export namespace SettingsAfterUpdateHandler {
    export type Interface = IEventHandler<SettingsAfterUpdateEvent>;
    export type Event = SettingsAfterUpdateEvent;
}
