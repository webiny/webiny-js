import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

type UseCaseError = NotAuthorizedError | KeyValueStore.Error;

/** Website Builder integrations (they hold credentials). */
export interface IGetIntegrationsUseCase {
    execute(): Promise<Result<Record<string, any>, UseCaseError>>;
}

export const GetIntegrationsUseCase = createAbstraction<IGetIntegrationsUseCase>(
    "Wb/GetIntegrationsUseCase"
);

export namespace GetIntegrationsUseCase {
    export type Interface = IGetIntegrationsUseCase;
    export type Error = UseCaseError;
}
