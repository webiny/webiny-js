import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ListApiKeysInput, ReadableApiKey } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export interface IListApiKeysErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
    validation: ApiKeyValidationError;
}

type ListApiKeysError = IListApiKeysErrors[keyof IListApiKeysErrors] | ApiKeysRepository.Error;

export interface IListApiKeys {
    execute(params?: ListApiKeysInput): Promise<Result<ReadableApiKey[], ListApiKeysError>>;
}

/** List all API keys. The `token` is only returned to full access. */
export const ListApiKeysUseCase = createAbstraction<IListApiKeys>("ListApiKeysUseCase");

export namespace ListApiKeysUseCase {
    export type Interface = IListApiKeys;
    export type Error = ListApiKeysError;
}
