import { createAbstraction } from "@webiny/feature/admin";
import type { IFrontendSettings } from "~/shared/types.js";

export interface IGetFrontendSettingsUseCase {
    execute(): Promise<IFrontendSettings>;
}

export const GetFrontendSettingsUseCase = createAbstraction<IGetFrontendSettingsUseCase>(
    "FrontendSettings/Admin/GetSettingsUseCase"
);

export namespace GetFrontendSettingsUseCase {
    export type Interface = IGetFrontendSettingsUseCase;
}

export interface IGetFrontendSettingsRepository {
    execute(): Promise<IFrontendSettings>;
}

export const GetFrontendSettingsRepository = createAbstraction<IGetFrontendSettingsRepository>(
    "FrontendSettings/Admin/GetSettingsRepository"
);

export namespace GetFrontendSettingsRepository {
    export type Interface = IGetFrontendSettingsRepository;
}

export interface IGetFrontendSettingsGateway {
    execute(): Promise<IFrontendSettings>;
}

export const GetFrontendSettingsGateway = createAbstraction<IGetFrontendSettingsGateway>(
    "FrontendSettings/Admin/GetSettingsGateway"
);

export namespace GetFrontendSettingsGateway {
    export type Interface = IGetFrontendSettingsGateway;
}
