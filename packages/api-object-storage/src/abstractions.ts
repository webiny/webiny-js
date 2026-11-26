import { createAbstraction } from "@webiny/feature/api";

export interface IObjectStorageUploadPartParams {
    key: string;
    uploadId: string;
    partNumber: number;
    body: Buffer;
}

export interface IObjectStorageAbortMultipartUploadsParams {
    /** Only uploads of keys under this prefix, which ends in `/`. */
    prefix: string;
    startedBefore: Date;
}

export interface IObjectStorageReadStream {
    /** The object's bytes, read from storage as the consumer pulls them. */
    body: AsyncIterable<Uint8Array>;
    /** The object's size in bytes. */
    size: number;
}

/**
 * Stores bytes by key. Features (the standalone file manager, for one) depend on this and never on
 * a provider; the project registers exactly one provider: a folder on disk
 * (`@webiny/api-object-storage-disk`) or an S3-compatible bucket (`@webiny/api-object-storage-s3`).
 * Keys are relative, `/`-separated paths such as `tenants/root/files/<id>/photo.png`, the same in
 * every provider (`isValidObjectKey`); a first segment starting with `.` is the provider's own.
 * Each feature keeps its keys under a top-level folder of its own, so that one feature's
 * `deletePrefix` never reaches another's. Failures are thrown; callers that hand out a `Result`
 * map them.
 */
export interface IObjectStorage {
    /** Stores `body` under `key`, replacing what is there. */
    put(key: string, body: Buffer): Promise<void>;
    /** Stores `body` under `key` only when nothing is there yet. Returns `false` when something is. */
    putIfAbsent(key: string, body: Buffer): Promise<boolean>;
    /** The contents stored under `key`, or `null` when nothing is. */
    get(key: string): Promise<Buffer | null>;
    /**
     * Opens the contents stored under `key` for reading in chunks, or returns `null` when nothing is.
     * Use it instead of `get` where the bytes only pass through (delivering a file), so a large
     * object never sits in memory whole. A consumer that stops early ends the iteration (`break`
     * in a `for await`), which releases the file or connection.
     */
    getStream(key: string): Promise<IObjectStorageReadStream | null>;
    /** Removes what is stored under `key`. Removing a missing key is not an error. */
    delete(key: string): Promise<void>;
    /** Removes everything whose key starts with `prefix`. */
    deletePrefix(prefix: string): Promise<void>;
    /** Whether anything is stored under a key that starts with `prefix`, which ends in `/`. */
    hasPrefix(prefix: string): Promise<boolean>;
    /** Starts a multipart upload of the object at `key`, and returns its upload ID. */
    createMultipartUpload(key: string): Promise<string>;
    /** Stores one part of a multipart upload, and returns its ETag. */
    uploadPart(params: IObjectStorageUploadPartParams): Promise<string>;
    /**
     * Joins the uploaded parts, in part number order, into the object at `key`. Fails when the
     * upload was not started for `key`.
     */
    completeMultipartUpload(key: string, uploadId: string): Promise<void>;
    /** Abandons multipart uploads started before a moment. Returns how many it abandoned. */
    abortMultipartUploads(params: IObjectStorageAbortMultipartUploadsParams): Promise<number>;
}

export const ObjectStorage = createAbstraction<IObjectStorage>("ObjectStorage");

export namespace ObjectStorage {
    export type Interface = IObjectStorage;
    export type UploadPartParams = IObjectStorageUploadPartParams;
    export type AbortMultipartUploadsParams = IObjectStorageAbortMultipartUploadsParams;
    export type ReadStream = IObjectStorageReadStream;
}

/**
 * The build param a project extension that provides `ObjectStorage` sets, to its own name
 * (`"disk"`, `"s3"`), so the host can check at startup that a provider is in the build before any
 * request resolves one. Every provider extension sets it.
 */
export const OBJECT_STORAGE_BUILD_PARAM = "ObjectStorage";
