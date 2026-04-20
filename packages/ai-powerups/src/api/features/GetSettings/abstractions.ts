import { createAbstraction, Result } from "@webiny/feature/api";
import type { AiPowerupsSettings } from "~/api/types.js";

export interface IGetSettingsRepository {
    get(): Promise<Result<AiPowerupsSettings | null>>;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "AiPowerupsGetSettingsRepository"
);

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettingsUseCase {
    execute(): Promise<Result<AiPowerupsSettings | null>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "AiPowerupsGetSettingsUseCase"
);

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
