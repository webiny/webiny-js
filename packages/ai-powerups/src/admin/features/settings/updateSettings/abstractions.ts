import { createAbstraction } from "@webiny/feature/admin";

export interface IUpdateSettingsUseCase {
    execute(data: Record<string, any>): Promise<Record<string, any>>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
    "AiPowerUps/UpdateSettingsUseCase"
);
export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
}

export interface IUpdateSettingsRepository {
    execute(data: Record<string, any>): Promise<Record<string, any>>;
}

export const UpdateSettingsRepository = createAbstraction<IUpdateSettingsRepository>(
    "AiPowerUps/UpdateSettingsRepository"
);
export namespace UpdateSettingsRepository {
    export type Interface = IUpdateSettingsRepository;
}

export interface IUpdateSettingsGateway {
    execute(data: Record<string, any>): Promise<Record<string, any>>;
}

export const UpdateSettingsGateway = createAbstraction<IUpdateSettingsGateway>(
    "AiPowerUps/UpdateSettingsGateway"
);
export namespace UpdateSettingsGateway {
    export type Interface = IUpdateSettingsGateway;
}
