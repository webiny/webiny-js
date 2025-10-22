import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, ListApiKeysInput } from "./types.js";
import { type ApiKeyNotFoundError, ApiKeyStorageError } from "./errors.js";

export interface IApiKeysRepositoryErrors {
    base: ApiKeyNotFoundError | ApiKeyStorageError;
}

type RepositoryError = IApiKeysRepositoryErrors[keyof IApiKeysRepositoryErrors];

export interface IApiKeysRepository {
    get(id: string): Promise<Result<ApiKey, RepositoryError>>;
    getByToken(token: string): Promise<Result<ApiKey, RepositoryError>>;
    list(params: ListApiKeysInput): Promise<Result<ApiKey[], RepositoryError>>;
    create(data: ApiKey): Promise<Result<void, RepositoryError>>;
    update(data: ApiKey): Promise<Result<void, RepositoryError>>;
    delete(apiKey: ApiKey): Promise<Result<void, RepositoryError>>;
}

export const ApiKeysRepository = createAbstraction<IApiKeysRepository>("ApiKeysRepository");

export namespace ApiKeysRepository {
    export type Interface = IApiKeysRepository;
    export type Error = RepositoryError;
}
