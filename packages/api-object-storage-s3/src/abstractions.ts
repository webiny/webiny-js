import { createAbstraction } from "@webiny/feature/api";

export interface IS3StorageConfig {
    readonly bucket: string;
    readonly region: string;
    /** For S3-compatible services (R2, Garage, SeaweedFS...). Unset for AWS S3. */
    readonly endpoint: string | undefined;
    /** `bucket` in the path instead of the host name; most self-hosted services need it. */
    readonly forcePathStyle: boolean;
    /** Prepended to every key, so one bucket can hold more than one project. Empty or ends in `/`. */
    readonly prefix: string;
    /** Unset to use the AWS SDK's default credential chain (env, instance or task role). */
    readonly credentials: { accessKeyId: string; secretAccessKey: string } | undefined;
}

/** The bucket `S3ObjectStorage` keeps files in, read from the `WEBINY_S3_*` env vars. */
export const S3StorageConfig = createAbstraction<IS3StorageConfig>("ObjectStorage/S3Config");

export namespace S3StorageConfig {
    export type Interface = IS3StorageConfig;
}

/** The value `<S3Storage />` gives the `OBJECT_STORAGE_BUILD_PARAM` build param. */
export const S3_OBJECT_STORAGE = "s3";
