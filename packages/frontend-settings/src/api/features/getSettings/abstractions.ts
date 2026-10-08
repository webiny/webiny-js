import { createAbstraction, type Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IStarterKit } from "~/shared/types.js";

export interface IFrontendGetSettingsResult {
    domain: string;
    /** Empty unless the caller can configure the frontend. */
    starterKits: IStarterKit[];
}

export interface IFrontendGetSettingsUseCase {
    execute(): Promise<Result<IFrontendGetSettingsResult, NotAuthorizedError>>;
}

export const FrontendGetSettingsUseCase = createAbstraction<IFrontendGetSettingsUseCase>(
    "FrontendSettings/GetSettingsUseCase"
);

export namespace FrontendGetSettingsUseCase {
    export type Interface = IFrontendGetSettingsUseCase;
    export type Return = Promise<Result<IFrontendGetSettingsResult, NotAuthorizedError>>;
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
