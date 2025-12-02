import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, UpdateApiKeyInput } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export interface IUpdateApiKeyErrors {
    notAuthorized: NotAuthorizedError;
    validation: ApiKeyValidationError;
}

type UpdateApiKeyError = IUpdateApiKeyErrors[keyof IUpdateApiKeyErrors] | ApiKeysRepository.Error;

export interface IUpdateApiKey {
    execute(id: string, input: UpdateApiKeyInput): Promise<Result<ApiKey, UpdateApiKeyError>>;
}

export const UpdateApiKey = createAbstraction<IUpdateApiKey>("UpdateApiKey");

export namespace UpdateApiKey {
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
