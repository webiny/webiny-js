import {
    AdminAfterBuild,
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeBuild,
    ApiBeforeWatch,
    Encryption,
    EnvVar,
    Hashing
} from "@webiny/project/extensions/index.js";
import { CiIs, CiIsNot } from "@webiny/project/extensions/infra/index.js";
import { Sqlite } from "./extensions/Sqlite.js";
import { Postgres } from "./extensions/Postgres.js";
import { FileStorage } from "./extensions/FileStorage.js";
import { ApiUrl } from "./extensions/ApiUrl.js";

/**
 * Server-flavour counterpart to project-aws's `Infra`, limited to what applies off-AWS. Omits the
 * AWS-only surface (Pulumi, deploy, Lambda, stack outputs, custom domains, Vpc, OpenSearch,
 * blue/green) and the environments surface (`Env.*`, `ProductionEnvironments`) — the self-hosted
 * flavour has no notion of deploy environments. Only build/watch hooks for the api + admin apps,
 * crypto config, env vars, and CI detection remain.
 */
export const Infra = {
    // Grouped crypto config surface (mirrors project-aws).
    Crypto: {
        Encryption,
        Hashing
    },
    // Kept top-level for backward compatibility (prefer Infra.Crypto.Encryption going forward).
    Encryption,
    EnvVar,
    // Server-flavour SQL storage (engine-named, like Infra.OpenSearch on AWS).
    Sqlite,
    Postgres,
    // Server-flavour local file storage (counterpart to the AWS S3 bucket).
    FileStorage,
    // Server-flavour public API origin (baked as the WEBINY_API_URL build param).
    ApiUrl,
    Ci: {
        Is: CiIs,
        IsNot: CiIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild
    }
};
