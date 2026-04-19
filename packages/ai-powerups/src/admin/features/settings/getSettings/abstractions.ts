import { createAbstraction } from "@webiny/feature/admin";

export interface IGetSettingsUseCase {
    execute(): Promise<Record<string, any>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "AiPowerUps/GetSettingsUseCase"
);
export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}

export interface IGetSettingsRepository {
    execute(): Promise<Record<string, any>>;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "AiPowerUps/GetSettingsRepository"
);
export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettingsGateway {
    execute(): Promise<Record<string, any>>;
}

export const GetSettingsGateway = createAbstraction<IGetSettingsGateway>(
    "AiPowerUps/GetSettingsGateway"
);
export namespace GetSettingsGateway {
    export type Interface = IGetSettingsGateway;
}
