import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, ListApiKeysInput } from "./types.js";
import {
    type ApiKeyNotFoundError,
    ApiKeyPersistenceError,
    ApiKeyValidationError
} from "./errors.js";

export interface IApiKeysRepositoryErrors {
    base: ApiKeyNotFoundError | ApiKeyPersistenceError | ApiKeyValidationError;
}

type RepositoryError = IApiKeysRepositoryErrors[keyof IApiKeysRepositoryErrors];

export interface IApiKeysRepository {
    get(id: string): Promise<Result<ApiKey, RepositoryError>>;
    getByToken(token: string): Promise<Result<ApiKey, RepositoryError>>;
    getBySlug(token: string): Promise<Result<ApiKey, RepositoryError>>;
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

export type CodeApiKey = Pick<ApiKey, "name" | "permissions" | "slug"> & {
    token: `wat_${string}`;
};

export interface IApiKeyFactory {
    execute(): Promise<CodeApiKey[]>;
}

export const ApiKeyFactory = createAbstraction<IApiKeyFactory>("ApiKeyFactory");

export namespace ApiKeyFactory {
    export type Interface = IApiKeyFactory;
    export type Return = Promise<CodeApiKey[]>;
    export type ApiKey = CodeApiKey;
}

export interface IApiKeyProvider {
    getByToken(token: string): Promise<ApiKey | null>;
    getBySlug(slug: string): Promise<ApiKey | null>;
}

export const ApiKeyProvider = createAbstraction<IApiKeyProvider>("ApiKeyProvider");

export namespace ApiKeyProvider {
    export type Interface = IApiKeyProvider;
}
