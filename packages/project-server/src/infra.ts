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
