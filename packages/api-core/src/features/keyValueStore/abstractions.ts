import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyNotFoundError, KeyValueStorageError, KeyValueInvalidCursorError } from "./errors.js";

export interface IKeyValueRecord<T = any> {
    key: string;
    value: T;
}

export interface IKeyValueListOptions {
    /** Most records on one page. Defaults to 100, capped at 1000. */
    limit?: number;
    /** The `cursor` of the previous page. Omit it for the first page. */
    cursor?: string;
}

export interface IKeyValueListResult<T = any> {
    items: IKeyValueRecord<T>[];
    /**
     * Pass it back as `cursor` for the next page; `null` when there is none. Opaque: it encodes
     * where the page stopped, not a page number, so records written meanwhile are not skipped.
     */
    cursor: string | null;
}

// GlobalKeyValueStore - Non-tenant-aware service
export interface IGlobalKeyValueStoreOptions {
    scope?: string;
    expiresAt?: Date;
}

export interface IGlobalKeyValueListOptions extends IKeyValueListOptions {
    scope?: string;
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
     * Records in the scope whose key starts with `prefix`, ordered by key, one page at a time. An
     * empty prefix lists the whole scope. Expired records are left out, so a page can hold fewer
     * than `limit` records and still have a next one.
     */
    list<T = unknown>(
        prefix: string,
        options?: IGlobalKeyValueListOptions
    ): Promise<Result<IKeyValueListResult<T>, KeyValueStoreRepository.Error>>;
}

/** Global (non-tenant-scoped) key-value store. */
export const GlobalKeyValueStore = createAbstraction<IGlobalKeyValueStore>("GlobalKeyValueStore");

export namespace GlobalKeyValueStore {
    export type Interface = IGlobalKeyValueStore;
    export type KeyValueRecord<T = any> = IKeyValueRecord<T>;
    export type ListResult<T = any> = IKeyValueListResult<T>;
    export type Error = KeyValueStoreRepository.Error;
}

// KeyValueStore - Tenant-aware service
export interface IKeyValueStore {
    get<T = unknown>(key: string): Promise<Result<T, KeyValueStoreRepository.Error>>;
    set(key: string, value: any): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(key: string): Promise<Result<void, KeyValueStoreRepository.Error>>;
    /** Records of the current tenant whose key starts with `prefix`, ordered by key, paged. */
    list<T = unknown>(
        prefix: string,
        options?: IKeyValueListOptions
    ): Promise<Result<IKeyValueListResult<T>, KeyValueStoreRepository.Error>>;
}

/** Tenant-scoped key-value store. */
export const KeyValueStore = createAbstraction<IKeyValueStore>("KeyValueStore");

export namespace KeyValueStore {
    export type Interface = IKeyValueStore;
    export type KeyValueRecord<T = any> = IKeyValueRecord<T>;
    export type ListResult<T = any> = IKeyValueListResult<T>;
    export type Error = KeyValueStoreRepository.Error;
}

// Repository

export interface IKeyValueStoreRepositoryErrors {
    base: KeyNotFoundError | KeyValueStorageError | KeyValueInvalidCursorError;
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
        scope: string,
        options?: IKeyValueListOptions
    ): Promise<Result<IKeyValueListResult<T>, RepositoryError>>;
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
    /**
     * Up to `limit` records in `scope` whose key starts with `prefix` and sorts after `after`,
     * ordered by the key's UTF-8 bytes, expired ones left out.
     */
    list(params: IKeyValueStorageListParams): Promise<IKeyValueStorageListResult>;
}

export interface IKeyValueStorageListParams {
    prefix: string;
    scope: string;
    limit: number;
    /** Only keys that sort after this one. */
    after?: string;
}

export interface IKeyValueStorageListResult {
    items: IKeyValueRecord[];
    /**
     * The last key this page read, expired records included, when more may follow; otherwise
     * `null`. The next page starts after it.
     */
    lastKey: string | null;
}

/** Storage operations for key-value persistence. */
export const KeyValueStorageOperations = createAbstraction<IKeyValueStorageOperations>(
    "KeyValueStorageOperations"
);

export namespace KeyValueStorageOperations {
    export type Interface = IKeyValueStorageOperations;
}
