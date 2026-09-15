import { createAbstraction, type Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IFrontendSettings } from "~/shared/types.js";

export interface IFrontendUpdateSettingsUseCase {
    execute(data: IFrontendSettings): Promise<Result<boolean, NotAuthorizedError>>;
}

export const FrontendUpdateSettingsUseCase = createAbstraction<IFrontendUpdateSettingsUseCase>(
    "FrontendSettings/UpdateSettingsUseCase"
);

export namespace FrontendUpdateSettingsUseCase {
    export type Interface = IFrontendUpdateSettingsUseCase;
    export type Return = Promise<Result<boolean, NotAuthorizedError>>;
}

export interface IFrontendUpdateSettingsRepository {
    execute(data: IFrontendSettings): Promise<boolean>;
}

export const FrontendUpdateSettingsRepository =
    createAbstraction<IFrontendUpdateSettingsRepository>(
        "FrontendSettings/UpdateSettingsRepository"
    );

export namespace FrontendUpdateSettingsRepository {
    export type Interface = IFrontendUpdateSettingsRepository;
}
