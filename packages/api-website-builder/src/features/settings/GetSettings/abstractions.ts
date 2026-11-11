import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

export interface WbSettings {
    previewDomain: string;
}

type UseCaseError = NotAuthorizedError | KeyValueStore.Error;

/** Website Builder settings. Any logged-in identity may read them. */
export interface IGetSettingsUseCase {
    execute(): Promise<Result<WbSettings, UseCaseError>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("Wb/GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Error = UseCaseError;
}
