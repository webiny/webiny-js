import {
    AdminAfterBuild,
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeBuild,
    ApiBeforeWatch,
    Encryption,
    EnvVar,
    Hashing,
    ProductionEnvironments
} from "@webiny/project/extensions/index.js";
import {
    CiIs,
    CiIsNot,
    EnvIs,
    EnvIsNot,
    EnvIsNotProd,
    EnvIsProd,
    useEnv
} from "@webiny/project/extensions/infra/index.js";

export { useEnv };

/**
 * Server-flavour counterpart to project-aws's `Infra`, limited to what applies off-AWS: there is no
 * Pulumi, no deploy command, no Lambda, and no `core` app — so the AWS-only surface (Vpc, OpenSearch,
 * blue/green, custom domains, stack outputs, *Pulumi, *Deploy hooks, Lambda/bundle-size) is omitted.
 * Only build/watch hooks for the api + admin apps remain.
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
    ProductionEnvironments,
    Env: {
        useEnv,
        Is: EnvIs,
        IsNot: EnvIsNot,
        IsProd: EnvIsProd,
        IsNotProd: EnvIsNotProd
    },
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
