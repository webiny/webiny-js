import { createAbstraction, Result } from "@webiny/feature/api";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface IGetSettingsRepository {
    get(): Promise<Result<IAiPowerUpsSettings>>;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "AiPowerUpsGetSettingsRepository"
);

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettingsUseCase {
    execute(): Promise<Result<IAiPowerUpsSettings>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "AiPowerUpsGetSettingsUseCase"
);

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
