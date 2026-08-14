import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyNotFoundError, KeyValueStorageError } from "./errors.js";

export interface IKeyValueRecord {
    key: string;
    value: any;
}

// GlobalKeyValueStore - Non-tenant-aware service
export interface IGlobalKeyValueStoreOptions {
    scope?: string;
    expiresAt?: Date;
    /**
     * Read with strong consistency (DynamoDB `ConsistentRead`) instead of the eventually-consistent
     * default. For a record updated read-modify-write under concurrency, where a stale read would drop a
     * just-committed write. Slightly higher cost, so opt in only where freshness is load-bearing.
     */
    consistent?: boolean;
}

/** Read options for a single key-value get. */
export interface IKeyValueStoreGetOptions {
    /** See {@link IGlobalKeyValueStoreOptions.consistent}. */
    consistent?: boolean;
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
}

/** Global (non-tenant-scoped) key-value store. */
export const GlobalKeyValueStore = createAbstraction<IGlobalKeyValueStore>("GlobalKeyValueStore");

export namespace GlobalKeyValueStore {
    export type Interface = IGlobalKeyValueStore;
    export type KeyValueRecord = IKeyValueRecord;
    export type Error = KeyValueStoreRepository.Error;
}

// KeyValueStore - Tenant-aware service
export interface IKeyValueStore {
    get<T = unknown>(
        key: string,
        options?: IKeyValueStoreGetOptions
    ): Promise<Result<T, KeyValueStoreRepository.Error>>;
    set(key: string, value: any): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(key: string): Promise<Result<void, KeyValueStoreRepository.Error>>;
}

/** Tenant-scoped key-value store. */
export const KeyValueStore = createAbstraction<IKeyValueStore>("KeyValueStore");

export namespace KeyValueStore {
    export type Interface = IKeyValueStore;
    export type KeyValueRecord = IKeyValueRecord;
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
    get<T = unknown>(
        key: string,
        scope: string,
        options?: IKeyValueStoreGetOptions
    ): Promise<Result<T, RepositoryError>>;
    set(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreSetOptions
    ): Promise<Result<void, RepositoryError>>;
    delete(key: string, scope: string): Promise<Result<void, RepositoryError>>;
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
    get(
        key: string,
        scope: string,
        options?: IKeyValueStoreGetOptions
    ): Promise<{ key: string; value: any } | null>;
    set(key: string, value: any, scope: string, options?: IKeyValueStoreSetOptions): Promise<void>;
    delete(key: string, scope: string): Promise<void>;
}

/** Storage operations for key-value persistence. */
export const KeyValueStorageOperations = createAbstraction<IKeyValueStorageOperations>(
    "KeyValueStorageOperations"
);

export namespace KeyValueStorageOperations {
    export type Interface = IKeyValueStorageOperations;
}
