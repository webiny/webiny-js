import { createAbstraction, Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { AiProvider, AiPersona, AiPowerupsSettings } from "~/api/types.js";

export interface SaveSettingsInput {
    providers: Array<Pick<AiProvider, "name" | "model" | "apiKey"> & { description?: string }>;
    personas: Array<Pick<AiPersona, "name" | "description">>;
}

export interface ISaveSettingsRepository {
    execute(input: SaveSettingsInput): Promise<Result<AiPowerupsSettings, Error>>;
}

export const SaveSettingsRepository = createAbstraction<ISaveSettingsRepository>(
    "AiPowerupsSaveSettingsRepository"
);

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
    export type Return = Promise<Result<AiPowerupsSettings, Error>>;
}

export interface ISaveSettingsUseCase {
    execute(input: SaveSettingsInput): Promise<Result<AiPowerupsSettings, Error>>;
}

export const SaveSettingsUseCase = createAbstraction<ISaveSettingsUseCase>(
    "AiPowerupsSaveSettingsUseCase"
);

export namespace SaveSettingsUseCase {
    export type Interface = ISaveSettingsUseCase;
    export type Return = Promise<Result<AiPowerupsSettings, Error>>;
}

// Domain events
export interface AiPowerupsSettingsBeforeSavePayload {
    input: SaveSettingsInput;
}

export interface AiPowerupsSettingsAfterSavePayload {
    settings: AiPowerupsSettings;
}

export const AiPowerupsSettingsBeforeSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<AiPowerupsSettingsBeforeSavePayload>>
>("AiPowerupsSettingsBeforeSaveEventHandler");

export namespace AiPowerupsSettingsBeforeSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<AiPowerupsSettingsBeforeSavePayload>>;
    export type Event = DomainEvent<AiPowerupsSettingsBeforeSavePayload>;
}

export const AiPowerupsSettingsAfterSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<AiPowerupsSettingsAfterSavePayload>>
>("AiPowerupsSettingsAfterSaveEventHandler");

export namespace AiPowerupsSettingsAfterSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<AiPowerupsSettingsAfterSavePayload>>;
    export type Event = DomainEvent<AiPowerupsSettingsAfterSavePayload>;
}
