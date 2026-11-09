import { AdminAfterBuild } from "@webiny/project/extensions/index.js";
import { AdminBeforeBuild } from "@webiny/project/extensions/index.js";
import { AdminBeforeWatch } from "@webiny/project/extensions/index.js";
import { ApiAfterBuild } from "@webiny/project/extensions/index.js";
import { ApiBeforeBuild } from "@webiny/project/extensions/index.js";
import { ApiBeforeWatch } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { CiIs } from "@webiny/project/extensions/infra/index.js";
import { CiIsNot } from "@webiny/project/extensions/infra/index.js";
import { AdminUrl } from "@webiny/project-standalone-extensions/extensions/index.js";
import { ApiUrl } from "@webiny/project-standalone-extensions/extensions/index.js";
import { FileStorage } from "@webiny/project-standalone-extensions/extensions/index.js";
import { Postgres } from "@webiny/project-standalone-extensions/extensions/index.js";
import { Sqlite } from "@webiny/project-standalone-extensions/extensions/index.js";
import { Encryption } from "./extensions/Encryption.js";
import { Hashing } from "./extensions/Hashing.js";

/**
 * Standalone hosting-type counterpart to project-aws's `Infra`, limited to what applies off-AWS. Omits the
 * AWS-only surface (Pulumi, deploy, Lambda, stack outputs, custom domains, Vpc, OpenSearch,
 * blue/green) and the environments surface (`Env.*`, `ProductionEnvironments`) — the standalone
 * hosting type has no notion of deploy environments. Only build/watch hooks for the api + admin apps,
 * crypto config, env vars, and CI detection remain.
 */
export const Infra = {
    /*
     * Grouped crypto config surface (mirrors project-aws). Standalone versions: the secrets are env
     * vars read when the API starts, not build params.
     */
    Crypto: {
        Encryption,
        Hashing
    },
    // Kept top-level for backward compatibility (prefer Infra.Crypto.Encryption going forward).
    Encryption,
    EnvVar,
    // Standalone hosting-type SQL storage (engine-named, like Infra.OpenSearch on AWS).
    Sqlite,
    Postgres,
    // Standalone hosting-type local file storage (counterpart to the AWS S3 bucket).
    FileStorage,
    // Standalone hosting-type public API URL (the WEBINY_API_URL env var).
    ApiUrl,
    // Standalone hosting-type public Admin app URL (the WEBINY_ADMIN_URL env var).
    AdminUrl,
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
