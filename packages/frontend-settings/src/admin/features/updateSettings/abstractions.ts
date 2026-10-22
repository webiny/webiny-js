import { createAbstraction } from "@webiny/feature/admin";

export type FrontendSettingsInput = {
    domain: string;
};

export interface IUpdateFrontendSettingsUseCase {
    execute(data: FrontendSettingsInput): Promise<boolean>;
}

export const UpdateFrontendSettingsUseCase = createAbstraction<IUpdateFrontendSettingsUseCase>(
    "FrontendSettings/Admin/UpdateSettingsUseCase"
);

export namespace UpdateFrontendSettingsUseCase {
    export type Interface = IUpdateFrontendSettingsUseCase;
}

export interface IUpdateFrontendSettingsRepository {
    execute(data: FrontendSettingsInput): Promise<boolean>;
}

export const UpdateFrontendSettingsRepository =
    createAbstraction<IUpdateFrontendSettingsRepository>(
        "FrontendSettings/Admin/UpdateSettingsRepository"
    );

export namespace UpdateFrontendSettingsRepository {
    export type Interface = IUpdateFrontendSettingsRepository;
}

export interface IUpdateFrontendSettingsGateway {
    execute(data: FrontendSettingsInput): Promise<boolean>;
}

export const UpdateFrontendSettingsGateway = createAbstraction<IUpdateFrontendSettingsGateway>(
    "FrontendSettings/Admin/UpdateSettingsGateway"
);

export namespace UpdateFrontendSettingsGateway {
    export type Interface = IUpdateFrontendSettingsGateway;
}
