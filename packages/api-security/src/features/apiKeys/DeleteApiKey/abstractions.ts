import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "~/features/apiKeys/index.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IDeleteApiKeyErrors {
    notAuthorized: NotAuthorizedError;
}

type DeleteApiKeyError = IDeleteApiKeyErrors[keyof IDeleteApiKeyErrors] | ApiKeysRepository.Error;

export interface IDeleteApiKey {
    execute(id: string): Promise<Result<void, DeleteApiKeyError>>;
}

export const DeleteApiKey = createAbstraction<IDeleteApiKey>("DeleteApiKey");

export namespace DeleteApiKey {
    export type Interface = IDeleteApiKey;
    export type Error = DeleteApiKeyError;
}

export interface ApiKeyBeforeDeletePayload {
    apiKey: ApiKey;
}

export interface ApiKeyAfterDeletePayload {
    apiKey: ApiKey;
}
