import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IFrontendSettings } from "~/shared/types.js";

export interface IFrontendGetSettingsUseCase {
    execute(): Promise<Result<IFrontendSettings, NotAuthorizedError>>;
}

export const FrontendGetSettingsUseCase = createAbstraction<IFrontendGetSettingsUseCase>(
    "FrontendSettings/GetSettingsUseCase"
);

export namespace FrontendGetSettingsUseCase {
    export type Interface = IFrontendGetSettingsUseCase;
    export type Return = Promise<Result<IFrontendSettings, NotAuthorizedError>>;
}

export interface IFrontendGetSettingsRepository {
    execute(): Promise<{ domain: string }>;
}

export const FrontendGetSettingsRepository = createAbstraction<IFrontendGetSettingsRepository>(
    "FrontendSettings/GetSettingsRepository"
);

export namespace FrontendGetSettingsRepository {
    export type Interface = IFrontendGetSettingsRepository;
}
