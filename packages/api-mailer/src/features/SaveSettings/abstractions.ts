import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { TransportSettings } from "~/types.js";

export interface SaveSettingsInput {
    host: string;
    port?: number;
    user: string;
    password?: string;
    from: string;
    replyTo?: string;
}

export interface ISaveSettingsRepository {
    save(input: SaveSettingsInput): Promise<Result<TransportSettings, never>>;
}

export const SaveSettingsRepository =
    createAbstraction<ISaveSettingsRepository>("SaveSettingsRepository");

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
}

export interface ISaveSettings {
    execute(input: SaveSettingsInput): Promise<Result<TransportSettings, never>>;
}

export const SaveSettings = createAbstraction<ISaveSettings>("SaveSettings");

export namespace SaveSettings {
    export type Interface = ISaveSettings;
}

// Domain Events
export interface MailerSettingsBeforeSavePayload {
    input: SaveSettingsInput;
}

export interface MailerSettingsAfterSavePayload {
    settings: TransportSettings;
}

// Event Handler Abstractions
export const MailerSettingsBeforeSaveHandler = createAbstraction<
    IEventHandler<DomainEvent<MailerSettingsBeforeSavePayload>>
>("MailerSettingsBeforeSaveHandler");

export namespace MailerSettingsBeforeSaveHandler {
    export type Interface = IEventHandler<DomainEvent<MailerSettingsBeforeSavePayload>>;
    export type Event = DomainEvent<MailerSettingsBeforeSavePayload>;
}

export const MailerSettingsAfterSaveHandler = createAbstraction<
    IEventHandler<DomainEvent<MailerSettingsAfterSavePayload>>
>("MailerSettingsAfterSaveHandler");

export namespace MailerSettingsAfterSaveHandler {
    export type Interface = IEventHandler<DomainEvent<MailerSettingsAfterSavePayload>>;
    export type Event = DomainEvent<MailerSettingsAfterSavePayload>;
}
