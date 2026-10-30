import { SIGNING_SECRET_ENV_VAR } from "~/shared/envVars.js";
import type { ResetPasswordTarget } from "./ResetPassword.js";

/** Set by project-standalone's `Infra/ApiUrl`, hence a literal rather than a shared constant. */
const API_URL_ENV_VAR = "WEBINY_API_URL";

type Env = Record<string, string | undefined>;

export interface ResetPasswordFlags {
    apiUrl?: string;
    signingSecret?: string;
}

/**
 * Where `webiny reset-password` sends the reset, and the secret it signs with: a flag if one was
 * passed, otherwise the env var.
 *
 * Called with `process.env` after the project SDK has loaded webiny.config, which copies the
 * config's env vars into the environment without overwriting ones already set. So the env var is
 * the operator's own value if they set one (e.g. from a secret manager, to reset on a deployed
 * instance), otherwise the dev default from `<Infra.ApiUrl>` / `<SelfHostedAuth signingSecret>`.
 *
 * Throws before anyone is asked for a password, so a missing value doesn't cost a typed-out one.
 */
export function readResetPasswordTarget(flags: ResetPasswordFlags, env: Env): ResetPasswordTarget {
    const signingSecret = flags.signingSecret || env[SIGNING_SECRET_ENV_VAR];
    if (!signingSecret) {
        throw new Error(
            `No JWT signing secret available. Set $${SIGNING_SECRET_ENV_VAR}, configure ` +
                "<SelfHostedAuth signingSecret={...} /> in webiny.config, or pass --signing-secret. " +
                "It has to match the secret the target API runs with."
        );
    }

    const apiUrl = flags.apiUrl || env[API_URL_ENV_VAR];
    if (!apiUrl) {
        throw new Error(
            `No API URL configured. Set $${API_URL_ENV_VAR}, add <Infra.ApiUrl url={...} /> to ` +
                "webiny.config, or pass --api-url."
        );
    }

    return {
        apiUrl: apiUrl.replace(/\/+$/, ""),
        signingSecret
    };
}
