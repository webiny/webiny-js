import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

type UseCaseError = NotAuthorizedError | KeyValueStore.Error;

/** Update Website Builder integrations. Requires the integrations permission. */
export interface IUpdateIntegrationsUseCase {
    execute(data: Record<string, any>): Promise<Result<void, UseCaseError>>;
}

export const UpdateIntegrationsUseCase = createAbstraction<IUpdateIntegrationsUseCase>(
    "Wb/UpdateIntegrationsUseCase"
);

export namespace UpdateIntegrationsUseCase {
    export type Interface = IUpdateIntegrationsUseCase;
    export type Error = UseCaseError;
}
