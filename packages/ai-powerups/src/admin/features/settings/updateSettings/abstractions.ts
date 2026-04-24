import { createAbstraction } from "@webiny/feature/admin";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

export interface IUpdateSettingsUseCase {
    execute(data: IAiPowerUpsSettings): Promise<IAiPowerUpsSettings>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
    "AiPowerUps/UpdateSettingsUseCase"
);
export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
}

export interface IUpdateSettingsRepository {
    execute(data: IAiPowerUpsSettings): Promise<IAiPowerUpsSettings>;
}

export const UpdateSettingsRepository = createAbstraction<IUpdateSettingsRepository>(
    "AiPowerUps/UpdateSettingsRepository"
);
export namespace UpdateSettingsRepository {
    export type Interface = IUpdateSettingsRepository;
}

export interface IUpdateSettingsGateway {
    execute(data: IAiPowerUpsSettings): Promise<IAiPowerUpsSettings>;
}

export const UpdateSettingsGateway = createAbstraction<IUpdateSettingsGateway>(
    "AiPowerUps/UpdateSettingsGateway"
);
export namespace UpdateSettingsGateway {
    export type Interface = IUpdateSettingsGateway;
}
