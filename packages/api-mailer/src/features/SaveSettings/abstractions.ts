import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { TransportSettings } from "~/types.js";
import {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized,
    SettingsLockedByCode
} from "~/domain/errors.js";

export interface SaveSettingsInput {
    host: string;
    port?: number;
    user: string;
    password?: string;
    from: string;
    replyTo?: string;
}

export interface ISaveSettingsErrors {
    validation: SettingsValidationError;
    persistence: SettingsPersistenceError;
    notAuthorized: SettingsNotAuthorized;
    lockedByCode: SettingsLockedByCode;
}

type SaveSettingsError = ISaveSettingsErrors[keyof ISaveSettingsErrors];

export interface ISaveSettingsRepository {
    execute(input: SaveSettingsInput): Promise<Result<TransportSettings, SaveSettingsError>>;
}

export const SaveSettingsRepository =
    createAbstraction<ISaveSettingsRepository>("SaveSettingsRepository");

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
    export type Return = Promise<Result<TransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

export interface ISaveSettings {
    execute(input: SaveSettingsInput): Promise<Result<TransportSettings, SaveSettingsError>>;
}

export const SaveSettingsUseCase = createAbstraction<ISaveSettings>("SaveSettingsUseCase");

export namespace SaveSettingsUseCase {
    export type Interface = ISaveSettings;
    export type Return = Promise<Result<TransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

// Domain Events
export interface MailerSettingsBeforeSavePayload {
    input: SaveSettingsInput;
}

export interface MailerSettingsAfterSavePayload {
    settings: TransportSettings;
}

// Event Handler Abstractions
export const MailerSettingsBeforeSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<MailerSettingsBeforeSavePayload>>
>("MailerSettingsBeforeSaveEventHandler");

export namespace MailerSettingsBeforeSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<MailerSettingsBeforeSavePayload>>;
    export type Event = DomainEvent<MailerSettingsBeforeSavePayload>;
}

export const MailerSettingsAfterSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<MailerSettingsAfterSavePayload>>
>("MailerSettingsAfterSaveEventHandler");

export namespace MailerSettingsAfterSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<MailerSettingsAfterSavePayload>>;
    export type Event = DomainEvent<MailerSettingsAfterSavePayload>;
}
