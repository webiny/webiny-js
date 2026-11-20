import { createAbstraction } from "@webiny/feature/api";

export interface IFileManagerDiskStorageConfig {
    readonly type: "disk";
    /** Absolute path of the directory uploaded files are written to and served from. */
    readonly path: string;
}

export interface IFileManagerS3StorageConfig {
    readonly type: "s3";
    readonly bucket: string;
    readonly region: string;
    /** For S3-compatible services (R2, MinIO, Garage...). Unset for AWS S3. */
    readonly endpoint: string | undefined;
    /** `bucket` in the path instead of the host name; most self-hosted services need it. */
    readonly forcePathStyle: boolean;
    /** Prepended to every key, so one bucket can hold more than one project. Empty or ends in `/`. */
    readonly prefix: string;
    /** Unset to use the AWS SDK's default credential chain (env, instance or task role). */
    readonly credentials: { accessKeyId: string; secretAccessKey: string } | undefined;
}

export type IFileManagerStorageConfig = IFileManagerDiskStorageConfig | IFileManagerS3StorageConfig;

export interface IFileManagerStandaloneConfig {
    /** Where uploaded files are kept. */
    readonly storage: IFileManagerStorageConfig;
    /** Secret that signs upload tokens. */
    readonly uploadSecret: string;
}

/**
 * File storage settings. The standalone API handler reads them from env when the server starts and
 * passes them to `FileManagerStandaloneFeature.register()`.
 */
export const FileManagerStandaloneConfig = createAbstraction<IFileManagerStandaloneConfig>(
    "FileManagerServer/Config"
);

export namespace FileManagerStandaloneConfig {
    export type Interface = IFileManagerStandaloneConfig;
    export type Storage = IFileManagerStorageConfig;
    export type DiskStorage = IFileManagerDiskStorageConfig;
    export type S3Storage = IFileManagerS3StorageConfig;
}
