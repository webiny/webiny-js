import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, UpdateApiKeyInput } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export interface IUpdateApiKeyErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
    validation: ApiKeyValidationError;
}

type UpdateApiKeyError = IUpdateApiKeyErrors[keyof IUpdateApiKeyErrors] | ApiKeysRepository.Error;

export interface IUpdateApiKey {
    execute(id: string, input: UpdateApiKeyInput): Promise<Result<ApiKey, UpdateApiKeyError>>;
}

export const UpdateApiKeyUseCase = createAbstraction<IUpdateApiKey>("UpdateApiKeyUseCase");

export namespace UpdateApiKeyUseCase {
    export type Interface = IUpdateApiKey;
    export type Error = UpdateApiKeyError;
}

export interface ApiKeyBeforeUpdatePayload {
    original: ApiKey;
    updated: ApiKey;
    input: UpdateApiKeyInput;
}

export interface ApiKeyAfterUpdatePayload {
    original: ApiKey;
    updated: ApiKey;
    input: UpdateApiKeyInput;
}
