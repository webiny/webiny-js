import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, CreateApiKeyInput } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export interface ICreateApiKeyErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
    validation: ApiKeyValidationError;
}

type CreateApiKeyError = ICreateApiKeyErrors[keyof ICreateApiKeyErrors] | ApiKeysRepository.Error;

export interface ICreateApiKey {
    execute(input: CreateApiKeyInput): Promise<Result<ApiKey, CreateApiKeyError>>;
}

export const CreateApiKey = createAbstraction<ICreateApiKey>("CreateApiKey");

export namespace CreateApiKey {
    export type Interface = ICreateApiKey;
    export type Error = CreateApiKeyError;
}

export interface ApiKeyBeforeCreatePayload {
    apiKey: ApiKey;
    input: CreateApiKeyInput;
}

export interface ApiKeyAfterCreatePayload {
    apiKey: ApiKey;
    input: CreateApiKeyInput;
}
