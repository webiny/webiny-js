import { SIGNING_SECRET_ENV_VAR } from "@webiny/self-hosted-auth";

type Env = Record<string, string | undefined>;

/**
 * The self-hosted auth signing secret, from env. Throws when it is missing or blank: without it no
 * one can log in, and falling back to a known value would let anyone mint a login token.
 */
export function readSigningSecret(env: Env): string {
    // Blank means unset, but the value itself is used as given: `webiny reset-password` signs with
    // the untrimmed value, and existing tokens were signed with it.
    const secret = env[SIGNING_SECRET_ENV_VAR];
    if (!secret?.trim()) {
        throw new Error(
            `The standalone API is missing required configuration: ${SIGNING_SECRET_ENV_VAR} is not set.`
        );
    }

    return secret;
}
