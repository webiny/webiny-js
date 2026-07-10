/**
 * Environment variable name prefixes that are safe to expose to the api RUNTIME — as opposed to
 * build-time-only vars (notably `WCP_PROJECT_LICENSE`, which the runtime deliberately re-fetches a
 * fresh copy of). This is the single source of truth shared by both flavours: the AWS Lambda sets
 * exactly these on the function, and the self-hosted server spawns its api process with exactly
 * these. `WCP_PROJECT_LICENSE` is excluded simply by not being listed.
 */
export const API_RUNTIME_ENV_PREFIXES = [
    // Covers WEBINY_API_*, WEBINY_PROJECT_API_KEY, WEBINY_ADMIN_*, WEBINY_SQL_FILENAME, etc.
    "WEBINY_",
    // Covers WCP_PROJECT_ENVIRONMENT + WCP_PROJECT_ENVIRONMENT_API_KEY (needed to fetch the license),
    // but NOT WCP_PROJECT_LICENSE (build-time only).
    "WCP_PROJECT_ENVIRONMENT",
    "OKTA_",
    "AUTH0_"
];

/**
 * Pick the api runtime env vars from `env` (the allowlist above), plus `DEBUG`. Returns a plain
 * string map suitable for a Lambda's env or a spawned server process's env.
 */
export function pickApiRuntimeEnvVariables(
    env: NodeJS.ProcessEnv = process.env
): Record<string, string> {
    const picked: Record<string, string> = {
        // Among other things, this determines how much detail runtime errors reveal.
        DEBUG: String(env.DEBUG)
    };

    for (const key of Object.keys(env)) {
        const value = env[key];
        if (
            value !== undefined &&
            API_RUNTIME_ENV_PREFIXES.some(prefix => key.startsWith(prefix))
        ) {
            picked[key] = String(value);
        }
    }

    return picked;
}

/**
 * System env vars a spawned server process needs to actually run — TLS trust (custom CAs, e.g.
 * portless), temp dirs, locale, PATH, etc. The AWS Lambda gets these from its own managed runtime;
 * a spawned Node process gets NOTHING unless we pass them (an explicit `env` replaces, not merges).
 * Kept explicit (not "everything non-Webiny") so arbitrary user vars don't silently leak into the
 * runtime — matching Lambda, which forwards only the app allowlist.
 */
const SYSTEM_ENV_NAMES = [
    "PATH",
    "HOME",
    "TMPDIR",
    "TMP",
    "TEMP",
    "TZ",
    "LANG",
    "LC_ALL",
    "SHELL",
    "USER",
    "LOGNAME",
    "PWD",
    "HOSTNAME",
    "TERM",
    "SSL_CERT_FILE",
    "SSL_CERT_DIR"
];

// NODE_* covers NODE_OPTIONS / NODE_EXTRA_CA_CERTS / NODE_ENV; LC_* covers locale categories.
const SYSTEM_ENV_PREFIXES = ["NODE_", "LC_"];

/**
 * Env for a spawned self-hosted server process: the api runtime allowlist (see above) PLUS the
 * system vars the process needs to run. This is the hybrid the server uses instead of inheriting the
 * whole environment — it forwards the same app vars as the Lambda (no arbitrary leakage) while still
 * keeping the process runnable.
 */
export function pickServerRuntimeEnvVariables(
    env: NodeJS.ProcessEnv = process.env
): Record<string, string> {
    const picked = pickApiRuntimeEnvVariables(env);

    for (const key of Object.keys(env)) {
        const value = env[key];
        if (value === undefined) {
            continue;
        }
        const isSystem =
            SYSTEM_ENV_NAMES.includes(key) ||
            SYSTEM_ENV_PREFIXES.some(prefix => key.startsWith(prefix));
        if (isSystem) {
            picked[key] = String(value);
        }
    }

    return picked;
}
