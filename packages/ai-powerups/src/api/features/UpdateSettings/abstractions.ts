import { createAbstraction, Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface IUpdateSettingsRepository {
    execute(input: IAiPowerUpsSettings): Promise<Result<IAiPowerUpsSettings, Error>>;
}

export const UpdateSettingsRepository = createAbstraction<IUpdateSettingsRepository>(
    "AiPowerUpsUpdateSettingsRepository"
);

export namespace UpdateSettingsRepository {
    export type Interface = IUpdateSettingsRepository;
    export type Return = Promise<Result<IAiPowerUpsSettings, Error>>;
}

export interface IUpdateSettingsUseCase {
    execute(input: IAiPowerUpsSettings): Promise<Result<IAiPowerUpsSettings, Error>>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
    "AiPowerUpsUpdateSettingsUseCase"
);

export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
    export type Return = Promise<Result<IAiPowerUpsSettings, Error>>;
    export type Params = IAiPowerUpsSettings;
}

// Domain events
export interface AiPowerUpsSettingsBeforeUpdatePayload {
    input: IAiPowerUpsSettings;
}

export interface AiPowerUpsSettingsAfterUpdatePayload {
    settings: IAiPowerUpsSettings;
}

export const AiPowerUpsSettingsBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>>
>("AiPowerUpsSettingsBeforeUpdateEventHandler");

export namespace AiPowerUpsSettingsBeforeUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>>;
    export type Event = DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>;
}

export const AiPowerUpsSettingsAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>>
>("AiPowerUpsSettingsAfterUpdateEventHandler");

export namespace AiPowerUpsSettingsAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>>;
    export type Event = DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>;
}
