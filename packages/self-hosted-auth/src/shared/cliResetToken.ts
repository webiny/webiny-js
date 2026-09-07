import jwt from "jsonwebtoken";

/**
 * Short-lived token that authorizes a password reset from the CLI. Signed with the SAME
 * HS256 secret as login tokens (`SelfHostedAuthSigningSecret`), which is what makes the
 * flow work: whoever can read `webiny.config.tsx` already holds that secret, and holding
 * it already permits minting a login token for any user (see SelfHostedJwtIdentityProvider,
 * which trusts `sub`). So a CLI reset grants no privilege that the secret did not already
 * grant. It just spares the operator from hand-crafting a JWT.
 *
 * Shared by both sides on purpose: the CLI command signs, the API verifies, and neither
 * can drift from the other's claim expectations.
 */

/**
 * Issuer stamped on CLI reset tokens. It MUST differ from `SELF_HOSTED_ISSUER`, or the
 * token would also satisfy the identity provider and become a login-as-anyone primitive.
 * `SelfHostedJwtIdentityProvider.isApplicable` rejects this issuer explicitly.
 */
export const CLI_RESET_ISSUER = "webiny-self-hosted-cli";

/**
 * Audience claim, verified on the API side. A second, independent reason a login token can
 * never be replayed as a reset token (and the reverse).
 */
export const CLI_RESET_AUDIENCE = "webiny-self-hosted/password-reset";

/**
 * Default token lifetime (seconds). Deliberately tiny: the token travels from the operator's
 * shell straight to the API, so it only has to survive one request, and a leaked token is
 * worthless within two minutes.
 */
export const CLI_RESET_DEFAULT_TTL = 120;

export interface SignCliResetTokenParams {
    secret: string;
    /** The account whose password is being reset. The only thing the token authorizes. */
    email: string;
    /** Lifetime in seconds. Defaults to `CLI_RESET_DEFAULT_TTL`. */
    expiresIn?: number;
}

export interface CliResetTokenClaims {
    email: string;
}

export const signCliResetToken = (params: SignCliResetTokenParams): string => {
    // No `sub` claim: this is not an identity token and must never be mistaken for one.
    return jwt.sign({ email: params.email }, params.secret, {
        algorithm: "HS256",
        issuer: CLI_RESET_ISSUER,
        audience: CLI_RESET_AUDIENCE,
        expiresIn: params.expiresIn ?? CLI_RESET_DEFAULT_TTL
    });
};

/**
 * Verifies signature, issuer, audience and expiry, and returns the claims the reset needs.
 * Returns `null` on any failure. The caller has no use for the distinction, and reporting
 * which check failed would only help someone probing the endpoint.
 */
export const verifyCliResetToken = (params: {
    secret: string;
    token: string;
}): CliResetTokenClaims | null => {
    try {
        const decoded = jwt.verify(params.token, params.secret, {
            algorithms: ["HS256"],
            issuer: CLI_RESET_ISSUER,
            audience: CLI_RESET_AUDIENCE
        });

        if (typeof decoded === "string") {
            return null;
        }

        // Reject a token that carries a subject: it would mean someone is trying to pass an
        // identity token through this path, and we would rather fail than guess.
        if (decoded.sub) {
            return null;
        }

        const email = decoded.email;
        if (typeof email !== "string" || email === "") {
            return null;
        }

        return { email };
    } catch {
        return null;
    }
};
