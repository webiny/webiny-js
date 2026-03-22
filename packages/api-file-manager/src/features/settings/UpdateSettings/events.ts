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
        return SettingsBeforeUpdateEventHandler;
    }
}

/** Hook into settings lifecycle before settings are updated. */
export const SettingsBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<SettingsBeforeUpdateEvent>
>("SettingsBeforeUpdateEventHandler");

export namespace SettingsBeforeUpdateEventHandler {
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
        return SettingsAfterUpdateEventHandler;
    }
}

/** Hook into settings lifecycle after settings are updated. */
export const SettingsAfterUpdateEventHandler = createAbstraction<
    IEventHandler<SettingsAfterUpdateEvent>
>("SettingsAfterUpdateEventHandler");

export namespace SettingsAfterUpdateEventHandler {
    export type Interface = IEventHandler<SettingsAfterUpdateEvent>;
    export type Event = SettingsAfterUpdateEvent;
}
