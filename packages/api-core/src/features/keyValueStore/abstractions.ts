import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyNotFoundError, KeyValueStorageError } from "./errors.js";

export interface IKeyValueRecord<T = any> {
    key: string;
    value: T;
}

// GlobalKeyValueStore - Non-tenant-aware service
export interface IGlobalKeyValueStoreOptions {
    scope?: string;
    expiresAt?: Date;
}

export interface IGlobalKeyValueStore {
    get<T = unknown>(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<T, KeyValueStoreRepository.Error>>;
    set(
        key: string,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, KeyValueStoreRepository.Error>>;
    /**
     * Every record in the scope whose key starts with `prefix`, ordered by key. An empty prefix
     * lists the whole scope. Expired records are left out.
     */
    list<T = unknown>(
        prefix: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<IKeyValueRecord<T>[], KeyValueStoreRepository.Error>>;
}

/** Global (non-tenant-scoped) key-value store. */
export const GlobalKeyValueStore = createAbstraction<IGlobalKeyValueStore>("GlobalKeyValueStore");

export namespace GlobalKeyValueStore {
    export type Interface = IGlobalKeyValueStore;
    export type KeyValueRecord<T = any> = IKeyValueRecord<T>;
    export type Error = KeyValueStoreRepository.Error;
}

// KeyValueStore - Tenant-aware service
export interface IKeyValueStore {
    get<T = unknown>(key: string): Promise<Result<T, KeyValueStoreRepository.Error>>;
    set(key: string, value: any): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(key: string): Promise<Result<void, KeyValueStoreRepository.Error>>;
    /** Every record of the current tenant whose key starts with `prefix`, ordered by key. */
    list<T = unknown>(
        prefix: string
    ): Promise<Result<IKeyValueRecord<T>[], KeyValueStoreRepository.Error>>;
}

/** Tenant-scoped key-value store. */
export const KeyValueStore = createAbstraction<IKeyValueStore>("KeyValueStore");

export namespace KeyValueStore {
    export type Interface = IKeyValueStore;
    export type KeyValueRecord<T = any> = IKeyValueRecord<T>;
    export type Error = KeyValueStoreRepository.Error;
}

// Repository

export interface IKeyValueStoreRepositoryErrors {
    base: KeyNotFoundError | KeyValueStorageError;
}

type RepositoryError = IKeyValueStoreRepositoryErrors[keyof IKeyValueStoreRepositoryErrors];

export interface IKeyValueStoreSetOptions {
    expiresAt?: Date;
}

export interface IKeyValueStoreRepository {
    get<T = unknown>(key: string, scope: string): Promise<Result<T, RepositoryError>>;
    set(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreSetOptions
    ): Promise<Result<void, RepositoryError>>;
    delete(key: string, scope: string): Promise<Result<void, RepositoryError>>;
    list<T = unknown>(
        prefix: string,
        scope: string
    ): Promise<Result<IKeyValueRecord<T>[], RepositoryError>>;
}

/** Persist and retrieve key-value pairs. */
export const KeyValueStoreRepository =
    createAbstraction<IKeyValueStoreRepository>("KeyValueStoreRepository");

export namespace KeyValueStoreRepository {
    export type Interface = IKeyValueStoreRepository;
    export type Error = RepositoryError;
}

// Storage Operations

export interface IKeyValueStorageOperations {
    get(key: string, scope: string): Promise<{ key: string; value: any } | null>;
    set(key: string, value: any, scope: string, options?: IKeyValueStoreSetOptions): Promise<void>;
    delete(key: string, scope: string): Promise<void>;
    /** Records in `scope` whose key starts with `prefix`, ordered by key, expired ones left out. */
    list(prefix: string, scope: string): Promise<IKeyValueRecord[]>;
}

/** Storage operations for key-value persistence. */
export const KeyValueStorageOperations = createAbstraction<IKeyValueStorageOperations>(
    "KeyValueStorageOperations"
);

export namespace KeyValueStorageOperations {
    export type Interface = IKeyValueStorageOperations;
}
