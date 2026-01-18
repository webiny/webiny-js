import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { ApiKeyNotAuthorizedError } from "../shared/errors.js";
import type { ApiKey } from "../shared/types.js";

export interface IDeleteApiKeyErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
}

type DeleteApiKeyError = IDeleteApiKeyErrors[keyof IDeleteApiKeyErrors] | ApiKeysRepository.Error;

export interface IDeleteApiKey {
    execute(id: string): Promise<Result<void, DeleteApiKeyError>>;
}

export const DeleteApiKeyUseCase = createAbstraction<IDeleteApiKey>("DeleteApiKeyUseCase");

export namespace DeleteApiKeyUseCase {
    export type Interface = IDeleteApiKey;
    export type Error = DeleteApiKeyError;
}

export interface ApiKeyBeforeDeletePayload {
    apiKey: ApiKey;
}

export interface ApiKeyAfterDeletePayload {
    apiKey: ApiKey;
}
