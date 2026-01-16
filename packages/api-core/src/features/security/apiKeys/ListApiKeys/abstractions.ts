import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ListApiKeysInput } from "../shared/types.js";
import type { ApiKey } from "~/types/security.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

export interface IListApiKeysErrors {
    notAuthorized: ApiKeyNotAuthorizedError;
    validation: ApiKeyValidationError;
}

type ListApiKeysError = IListApiKeysErrors[keyof IListApiKeysErrors] | ApiKeysRepository.Error;

export interface IListApiKeys {
    execute(params: ListApiKeysInput): Promise<Result<ApiKey[], ListApiKeysError>>;
}

export const ListApiKeys = createAbstraction<IListApiKeys>("ListApiKeys");

export namespace ListApiKeys {
    export type Interface = IListApiKeys;
    export type Error = ListApiKeysError;
}
