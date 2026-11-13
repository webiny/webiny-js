import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { WbSettings } from "../GetSettings/abstractions.js";

type UseCaseError = NotAuthorizedError | KeyValueStore.Error;

/** Update Website Builder settings. Requires the settings permission. */
export interface IUpdateSettingsUseCase {
    execute(data: WbSettings): Promise<Result<void, UseCaseError>>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
    "Wb/UpdateSettingsUseCase"
);

export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
    export type Error = UseCaseError;
}
