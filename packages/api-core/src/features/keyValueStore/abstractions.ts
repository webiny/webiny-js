import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyNotFoundError } from "./errors.js";
import { KeyValueStorageError } from "./errors.js";
import { KeyValueInvalidCursorError } from "./errors.js";
import { KeyValueInvalidCollectionError } from "./errors.js";
import { KeyValueKeyTooLongError } from "./errors.js";

export interface IKeyValueRecord<T = any> {
    key: string;
    value: T;
}

/**
 * A record is listable only as a member of a collection, and only when the write that stored it
 * named that collection. A write without `collection` takes the record out of the one it was in,
 * since every write replaces the whole record.
 *
 * A collection name and the key of a record in a collection are each limited to 1000 UTF-8 bytes.
 *
 * Each collection is stored apart from every other, so keep one to records that are listed
 * together, such as one user's chats. A collection spanning a whole tenant, like every uploaded
 * file, puts all of them in one place that only ever grows.
 */
export interface IKeyValueCollectionOptions {
    collection?: string;
}

export interface IKeyValueListParams {
    collection: string;
    /** Most records on one page. Defaults to 100, capped at 1000. */
    limit?: number;
    /** The `cursor` of the previous page. Omit it for the first page. */
    cursor?: string;
    /** Descending key order. A cursor continues in the order of the page that returned it. */
    reverse?: boolean;
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

export interface IGlobalKeyValueSetOptions
    extends IGlobalKeyValueStoreOptions, IKeyValueCollectionOptions {}

/*
 * The conditional writes below check the record and write it as one step in the store, so two
 * callers racing for the same key cannot both succeed. They resolve to whether the write happened.
 *
 * An expired record counts as absent, the same as for `get`. A record they write belongs to no
 * collection. `expected` is a string, number or boolean, and matches a record whose whole value is
 * that same scalar: DynamoDB cannot compare whole maps in a condition, so objects are not accepted.
 */
export type KeyValueComparable = string | number | boolean;

export interface IGlobalKeyValueListParams extends IKeyValueListParams {
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
        options?: IGlobalKeyValueSetOptions
    ): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, KeyValueStoreRepository.Error>>;
    /**
     * One page of a collection in the scope, ordered by key. Expired records are left out, so a
     * page can hold fewer than `limit` records and still have a next one.
     */
    list<T = unknown>(
        params: IGlobalKeyValueListParams
    ): Promise<Result<IKeyValueListResult<T>, KeyValueStoreRepository.Error>>;
    /** Writes the record only if there is none, or the one there has expired. */
    setIfAbsent(
        key: string,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, KeyValueStoreRepository.Error>>;
    /** Replaces the record only if its current value equals `expected`. */
    replaceIf(
        key: string,
        expected: KeyValueComparable,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, KeyValueStoreRepository.Error>>;
    /** Deletes the record only if its current value equals `expected`. */
    deleteIf(
        key: string,
        expected: KeyValueComparable,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, KeyValueStoreRepository.Error>>;
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
    set(
        key: string,
        value: any,
        options?: IKeyValueCollectionOptions
    ): Promise<Result<void, KeyValueStoreRepository.Error>>;
    delete(key: string): Promise<Result<void, KeyValueStoreRepository.Error>>;
    /** One page of a collection of the current tenant, ordered by key. */
    list<T = unknown>(
        params: IKeyValueListParams
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
    base:
        | KeyNotFoundError
        | KeyValueStorageError
        | KeyValueInvalidCursorError
        | KeyValueInvalidCollectionError
        | KeyValueKeyTooLongError;
}

type RepositoryError = IKeyValueStoreRepositoryErrors[keyof IKeyValueStoreRepositoryErrors];

export interface IKeyValueStoreSetOptions extends IKeyValueCollectionOptions {
    expiresAt?: Date;
}

export interface IKeyValueStoreConditionalOptions {
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
        scope: string,
        params: IKeyValueListParams
    ): Promise<Result<IKeyValueListResult<T>, RepositoryError>>;
    setIfAbsent(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<Result<boolean, RepositoryError>>;
    replaceIf(
        key: string,
        expected: KeyValueComparable,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<Result<boolean, RepositoryError>>;
    deleteIf(
        key: string,
        expected: KeyValueComparable,
        scope: string
    ): Promise<Result<boolean, RepositoryError>>;
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
    /** Puts the record in `options.collection`, or in none when it is not given. */
    set(key: string, value: any, scope: string, options?: IKeyValueStoreSetOptions): Promise<void>;
    delete(key: string, scope: string): Promise<void>;
    /**
     * Up to `limit` members of `collection` in `scope` past `after`, ordered by the key's UTF-8
     * bytes (descending when `reverse`), expired ones left out.
     */
    list(params: IKeyValueStorageListParams): Promise<IKeyValueStorageListResult>;
    /**
     * Writes when there is no record, or only an expired one.
     *
     * This and the two below each check and write as one atomic step, and resolve to whether they
     * wrote. An expired record counts as absent. The record they leave belongs to no collection, as
     * after a `set` without one.
     */
    setIfAbsent(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<boolean>;
    /** Replaces a live record whose value equals `expected`. */
    replaceIf(
        key: string,
        expected: KeyValueComparable,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<boolean>;
    /** Deletes a live record whose value equals `expected`. */
    deleteIf(key: string, expected: KeyValueComparable, scope: string): Promise<boolean>;
}

export interface IKeyValueStorageListParams {
    collection: string;
    scope: string;
    limit: number;
    reverse: boolean;
    /** Only keys past this one, in the order of the listing. */
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
