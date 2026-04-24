import { createAbstraction } from "@webiny/feature/admin";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

export interface IGetSettingsUseCase {
    execute(): Promise<IAiPowerUpsSettings>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "AiPowerUps/GetSettingsUseCase"
);
export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}

export interface IGetSettingsRepository {
    execute(): Promise<IAiPowerUpsSettings>;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "AiPowerUps/GetSettingsRepository"
);
export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettingsGateway {
    execute(): Promise<IAiPowerUpsSettings>;
}

export const GetSettingsGateway = createAbstraction<IGetSettingsGateway>(
    "AiPowerUps/GetSettingsGateway"
);
export namespace GetSettingsGateway {
    export type Interface = IGetSettingsGateway;
}
