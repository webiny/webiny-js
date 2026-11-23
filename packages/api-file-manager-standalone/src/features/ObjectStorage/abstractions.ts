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

/**
 * Where uploaded files and their resized copies are kept: a folder on disk (`DiskObjectStorage`,
 * the default), or what a project extension registers instead, such as the S3-compatible bucket of
 * `@webiny/api-file-manager-standalone-s3`. Keys are relative, `/`-separated paths such as
 * `tenants/root/files/<id>/photo.png`, the same in every storage. Failures are thrown; callers that
 * hand out a `Result` map them.
 */
export interface IObjectStorage {
    /** Stores `body` under `key`, replacing what is there. */
    put(key: string, body: Buffer): Promise<void>;
    /** Stores `body` under `key` only when nothing is there yet. Returns `false` when something is. */
    putIfAbsent(key: string, body: Buffer): Promise<boolean>;
    /** The contents stored under `key`, or `null` when nothing is. */
    get(key: string): Promise<Buffer | null>;
    /** Removes what is stored under `key`. Removing a missing key is not an error. */
    delete(key: string): Promise<void>;
    /** Removes everything whose key starts with `prefix`. */
    deletePrefix(prefix: string): Promise<void>;
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

export const ObjectStorage = createAbstraction<IObjectStorage>("FileManagerServer/ObjectStorage");

export namespace ObjectStorage {
    export type Interface = IObjectStorage;
    export type UploadPartParams = IObjectStorageUploadPartParams;
    export type AbortMultipartUploadsParams = IObjectStorageAbortMultipartUploadsParams;
}

export interface IDiskStorageConfig {
    /** Absolute path of the folder. */
    readonly path: string;
}

/** The folder `DiskObjectStorage` keeps files in. */
export const DiskStorageConfig = createAbstraction<IDiskStorageConfig>(
    "FileManagerServer/DiskStorageConfig"
);

export namespace DiskStorageConfig {
    export type Interface = IDiskStorageConfig;
}

/**
 * The build param a project extension that provides the storage sets (`<S3FileStorage />` sets
 * `"s3"`). The standalone API reads it at startup to know that `WEBINY_LOCAL_STORAGE_PATH` is not
 * needed.
 */
export const FILE_STORAGE_BUILD_PARAM = "FileManagerStorage";
