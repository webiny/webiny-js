import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ReadableApiKey } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { ApiKeyNotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";

export interface IGetApiKeyErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
}

type GetApiKeyError = IGetApiKeyErrors[keyof IGetApiKeyErrors] | ApiKeysRepository.Error;

export interface IGetApiKey {
    execute(id: string): Promise<Result<ReadableApiKey | null, GetApiKeyError>>;
}

/** Retrieve an API key by ID. The `token` is only returned to full access. */
export const GetApiKeyUseCase = createAbstraction<IGetApiKey>("GetApiKeyUseCase");

export namespace GetApiKeyUseCase {
    export type Interface = IGetApiKey;
    export type Error = GetApiKeyError;
}
