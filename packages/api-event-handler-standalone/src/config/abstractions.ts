import { createAbstraction } from "@webiny/feature/api";
import type { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";

export interface IStandaloneConfig {
    /** `WEBINY_API_URL`. Required. */
    readonly apiUrl: PublicUrl;
    /** `WEBINY_ADMIN_URL`. Optional: unknown when not set. */
    readonly adminUrl: PublicUrl;
    readonly fileStorage: {
        /** `WEBINY_LOCAL_STORAGE_PATH`, resolved to an absolute path. Required. */
        readonly storagePath: string;
        /** `WEBINY_UPLOAD_SECRET`. Required. */
        readonly uploadSecret: string;
    };
    readonly encryption: {
        /**
         * `WEBINY_ENCRYPTION_PASSPHRASE`. Required when the build declares encryption
         * (`<Infra.Crypto.Encryption>`), ignored otherwise.
         */
        readonly passphrase: string | null;
        /** `WEBINY_ENCRYPTION_SALT`. Optional. */
        readonly salt: string;
    };
    readonly hashing: {
        /**
         * `WEBINY_HASHING_PEPPER`. Required when the build declares a pepper
         * (`<Infra.Crypto.Hashing pepper>`), ignored otherwise.
         */
        readonly pepper: string | null;
    };
}

/**
 * Deployment-specific settings of a standalone API, read from env once when the server starts.
 * Nothing here is baked into the build, so one build runs in every environment.
 */
export const StandaloneConfig = createAbstraction<IStandaloneConfig>("Standalone/Config");

export namespace StandaloneConfig {
    export type Interface = IStandaloneConfig;
}
