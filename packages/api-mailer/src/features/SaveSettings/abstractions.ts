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

/**
 * Save-side returns are password-free. The only path that exposes the password
 * to in-process callers is GetSettingsRepository.get / GetSettingsUseCase.execute
 * (used by MailerService to authenticate SMTP). Everything else — events,
 * GraphQL responses, logs, audit trails — must use this Omit shape.
 */
export type SavedTransportSettings = Omit<TransportSettings, "password">;

export interface ISaveSettingsRepository {
    execute(input: SaveSettingsInput): Promise<Result<SavedTransportSettings, SaveSettingsError>>;
}

export const SaveSettingsRepository =
    createAbstraction<ISaveSettingsRepository>("SaveSettingsRepository");

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
    export type Return = Promise<Result<SavedTransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

export interface ISaveSettings {
    execute(input: SaveSettingsInput): Promise<Result<SavedTransportSettings, SaveSettingsError>>;
}

export const SaveSettingsUseCase = createAbstraction<ISaveSettings>("SaveSettingsUseCase");

export namespace SaveSettingsUseCase {
    export type Interface = ISaveSettings;
    export type Return = Promise<Result<SavedTransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

// Domain Events. Both payloads exclude `password` so subscribers (audit logs,
// telemetry, etc.) cannot accidentally persist plaintext or ciphertext secrets.
export interface MailerSettingsBeforeSavePayload {
    input: Omit<SaveSettingsInput, "password">;
}

export interface MailerSettingsAfterSavePayload {
    settings: Omit<TransportSettings, "password">;
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
