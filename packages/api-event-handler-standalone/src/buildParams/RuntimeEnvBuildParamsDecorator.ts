import nodePath from "node:path";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

/**
 * Build params that differ per deployment, keyed by build param, with the env var that overrides
 * each one. The env var names are the ones `webiny.config.tsx` already reads at build time, so the
 * same name works in both places.
 */
const RUNTIME_ENV_BUILD_PARAMS: Record<string, string> = {
    WEBINY_API_URL: "WEBINY_API_URL",
    WEBINY_ADMIN_URL: "WEBINY_ADMIN_URL",
    WEBINY_LOCAL_STORAGE_PATH: "WEBINY_LOCAL_STORAGE_PATH",
    WEBINY_UPLOAD_SECRET: "WEBINY_UPLOAD_SECRET",
    SelfHostedAuthSigningSecret: "WEBINY_SELF_HOSTED_AUTH_SECRET"
};

/** `<Infra.FileStorage>` resolves a relative path against the project root; at runtime, the cwd. */
const PATH_BUILD_PARAMS = new Set(["WEBINY_LOCAL_STORAGE_PATH"]);

function readEnv(key: string): string | null {
    const envVar = RUNTIME_ENV_BUILD_PARAMS[key];
    const value = envVar ? process.env[envVar]?.trim() : undefined;
    if (!value) {
        return null;
    }

    return PATH_BUILD_PARAMS.has(key) ? nodePath.resolve(value) : value;
}

/**
 * Lets runtime env override the deployment-specific build params listed above, so one standalone
 * build (a "golden image") runs in dev, staging and prod on different domains with different
 * secrets. The baked-in value stays as the default, which keeps `webiny watch` and local `serve`
 * working without any env.
 *
 * Lives in the composition layer for the same reason the SQL connection reads `WEBINY_PG_*` here:
 * feature code reads `BuildParams` and never touches `process.env`.
 */
class RuntimeEnvBuildParamsDecoratorImpl implements BuildParams.Interface {
    constructor(private decoratee: BuildParams.Interface) {}

    get<T = any>(key: string): T | null {
        const value = readEnv(key);
        if (value !== null) {
            return value as T;
        }

        return this.decoratee.get<T>(key);
    }
}

export const RuntimeEnvBuildParamsDecorator = BuildParams.createDecorator({
    decorator: RuntimeEnvBuildParamsDecoratorImpl,
    dependencies: []
});
