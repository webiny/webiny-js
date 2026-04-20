import { createAbstraction, Result } from "@webiny/feature/api";
import type {
  DomainEvent,
  IEventHandler,
} from "@webiny/api-core/features/eventPublisher/index.js";
import type { AiProvider, AiPersona, AiPowerUpsSettings } from "~/api/types.js";

export interface UpdateSettingsInput {
  providers: {
    presets: Array<
      Pick<AiProvider, "name" | "model" | "apiKey"> & { description?: string }
    >;
  };
  personas: {
    presets: Array<Pick<AiPersona, "name" | "description">>;
  };
}

export interface IUpdateSettingsRepository {
  execute(
    input: UpdateSettingsInput,
  ): Promise<Result<AiPowerUpsSettings, Error>>;
}

export const UpdateSettingsRepository =
  createAbstraction<IUpdateSettingsRepository>(
    "AiPowerUpsUpdateSettingsRepository",
  );

export namespace UpdateSettingsRepository {
  export type Interface = IUpdateSettingsRepository;
  export type Return = Promise<Result<AiPowerUpsSettings, Error>>;
}

export interface IUpdateSettingsUseCase {
  execute(
    input: UpdateSettingsInput,
  ): Promise<Result<AiPowerUpsSettings, Error>>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
  "AiPowerUpsUpdateSettingsUseCase",
);

export namespace UpdateSettingsUseCase {
  export type Interface = IUpdateSettingsUseCase;
  export type Return = Promise<Result<AiPowerUpsSettings, Error>>;
  export type Params = UpdateSettingsInput;
}

// Domain events
export interface AiPowerUpsSettingsBeforeUpdatePayload {
  input: UpdateSettingsInput;
}

export interface AiPowerUpsSettingsAfterUpdatePayload {
  settings: AiPowerUpsSettings;
}

export const AiPowerUpsSettingsBeforeUpdateEventHandler = createAbstraction<
  IEventHandler<DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>>
>("AiPowerUpsSettingsBeforeUpdateEventHandler");

export namespace AiPowerUpsSettingsBeforeUpdateEventHandler {
  export type Interface = IEventHandler<
    DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>
  >;
  export type Event = DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload>;
}

export const AiPowerUpsSettingsAfterUpdateEventHandler = createAbstraction<
  IEventHandler<DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>>
>("AiPowerUpsSettingsAfterUpdateEventHandler");

export namespace AiPowerUpsSettingsAfterUpdateEventHandler {
  export type Interface = IEventHandler<
    DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>
  >;
  export type Event = DomainEvent<AiPowerUpsSettingsAfterUpdatePayload>;
}
