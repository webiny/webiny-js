import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import type {
    SettingsValidationError,
    SettingsPersistenceError,
    SettingsNotAuthorized,
    SettingsLockedByCode,
    UnknownTransportSettings
} from "~/domain/errors.js";

export interface ISaveSettingsErrors {
    validation: SettingsValidationError;
    persistence: SettingsPersistenceError;
    notAuthorized: SettingsNotAuthorized;
    lockedByCode: SettingsLockedByCode;
    unknownTransport: UnknownTransportSettings;
}

type SaveSettingsError = ISaveSettingsErrors[keyof ISaveSettingsErrors];

/**
 * Everything the save path returns or publishes leaves the transport's secrets out. Only
 * `GetSettingsRepository.get` returns them, for the transport itself.
 */
export type SavedTransportSettings = TransportSettingsDefinition.Values;

export interface ISaveSettingsRepository {
    execute(
        definition: TransportSettingsDefinition.Interface,
        input: TransportSettingsDefinition.Values
    ): Promise<Result<SavedTransportSettings, SaveSettingsError>>;
}

export const SaveSettingsRepository =
    createAbstraction<ISaveSettingsRepository>("SaveSettingsRepository");

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
    export type Return = Promise<Result<SavedTransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

export interface ISaveSettings {
    execute(
        transport: string,
        input: TransportSettingsDefinition.Values
    ): Promise<Result<SavedTransportSettings, SaveSettingsError>>;
}

export const SaveSettingsUseCase = createAbstraction<ISaveSettings>("SaveSettingsUseCase");

export namespace SaveSettingsUseCase {
    export type Interface = ISaveSettings;
    export type Return = Promise<Result<SavedTransportSettings, SaveSettingsError>>;
    export type Error = SaveSettingsError;
}

// Domain events. Both payloads leave the transport's secrets out, so subscribers (audit logs,
// telemetry) can't persist them.
export interface MailerSettingsBeforeSavePayload {
    transport: string;
    input: TransportSettingsDefinition.Values;
}

export interface MailerSettingsAfterSavePayload {
    transport: string;
    settings: SavedTransportSettings;
}

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
