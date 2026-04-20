import { createAbstraction } from "@webiny/feature/admin";
import type { ISettings } from "~/admin/features/settings/shared/abstractions.js";

export interface IUpdateSettingsUseCase {
  execute(data: ISettings): Promise<ISettings>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
  "AiPowerUps/UpdateSettingsUseCase",
);
export namespace UpdateSettingsUseCase {
  export type Interface = IUpdateSettingsUseCase;
}

export interface IUpdateSettingsRepository {
  execute(data: ISettings): Promise<ISettings>;
}

export const UpdateSettingsRepository =
  createAbstraction<IUpdateSettingsRepository>(
    "AiPowerUps/UpdateSettingsRepository",
  );
export namespace UpdateSettingsRepository {
  export type Interface = IUpdateSettingsRepository;
}

export interface IUpdateSettingsGateway {
  execute(data: ISettings): Promise<ISettings>;
}

export const UpdateSettingsGateway = createAbstraction<IUpdateSettingsGateway>(
  "AiPowerUps/UpdateSettingsGateway",
);
export namespace UpdateSettingsGateway {
  export type Interface = IUpdateSettingsGateway;
}
