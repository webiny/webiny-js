import { createAbstraction } from "@webiny/feature/api";
import type { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import type { FileManagerStandaloneConfig } from "@webiny/api-file-manager-standalone/features/FileManagerStandaloneConfig/abstractions.js";

export interface IStandaloneConfig {
    /** `WEBINY_API_URL`. Required. */
    readonly apiUrl: PublicUrl;
    /** `WEBINY_ADMIN_URL`. Optional: unknown when not set. */
    readonly adminUrl: PublicUrl;
    /**
     * `WEBINY_LOCAL_STORAGE_PATH` (a folder on disk, resolved to an absolute path) or
     * `WEBINY_S3_BUCKET` and the other `WEBINY_S3_*` variables (an S3-compatible bucket), plus
     * `WEBINY_UPLOAD_SECRET`. Required.
     */
    readonly fileStorage: FileManagerStandaloneConfig.Interface;
    readonly encryption: {
        /** `WEBINY_ENCRYPTION_PASSPHRASE`. Required: standalone always encrypts. */
        readonly passphrase: string;
        /** `WEBINY_ENCRYPTION_SALT`. Optional. */
        readonly salt: string;
    };
    readonly hashing: {
        /** `WEBINY_HASHING_PEPPER`. Required: standalone always peppers its hashes. */
        readonly pepper: string;
    };
    /**
     * `WEBINY_REDIS_URL`. Optional. When set, websocket messages travel between API processes
     * through this Redis or Valkey server; required when more than one API process runs.
     */
    readonly redisUrl: string | undefined;
}

/**
 * Deployment-specific settings of a standalone API, read from env once when the server starts.
 * Nothing here is baked into the build, so one build runs in every environment.
 */
export const StandaloneConfig = createAbstraction<IStandaloneConfig>("Standalone/Config");

export namespace StandaloneConfig {
    export type Interface = IStandaloneConfig;
}
