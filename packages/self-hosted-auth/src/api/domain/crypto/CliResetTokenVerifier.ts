import { createAbstraction, createFeature } from "@webiny/feature/api";
import { SelfHostedAuthConfig } from "~/api/domain/SelfHostedAuthConfig.js";
import { verifyCliResetToken, type CliResetTokenClaims } from "~/shared/cliResetToken.js";

export interface ICliResetTokenVerifier {
    /** Returns the claims a reset needs, or `null` if the token is not valid. */
    verify(token: string): CliResetTokenClaims | null;
}

/**
 * Verifies the short-lived tokens the `reset-password` CLI command mints. Kept separate from
 * `TokenIssuer` so that neither concern can reach the other's claims: this one never issues
 * identity tokens, and `TokenIssuer` never accepts reset tokens.
 */
export const CliResetTokenVerifier =
    createAbstraction<ICliResetTokenVerifier>("CliResetTokenVerifier");

export namespace CliResetTokenVerifier {
    export type Interface = ICliResetTokenVerifier;
    export type Claims = CliResetTokenClaims;
}

class JwtCliResetTokenVerifier implements ICliResetTokenVerifier {
    private readonly secret: string;

    constructor(config: SelfHostedAuthConfig.Interface) {
        // Same secret as login tokens. `SelfHostedAuthApiFeature` refuses to register without
        // it, so an empty value here means the module is misconfigured, and `verify` failing
        // closed is the right outcome.
        this.secret = config.signingSecret;
    }

    verify(token: string): CliResetTokenClaims | null {
        if (!this.secret) {
            return null;
        }

        return verifyCliResetToken({ secret: this.secret, token });
    }
}

const jwtCliResetTokenVerifier = CliResetTokenVerifier.createImplementation({
    implementation: JwtCliResetTokenVerifier,
    dependencies: [SelfHostedAuthConfig]
});

export const CliResetTokenVerifierFeature = createFeature({
    name: "CliResetTokenVerifier",
    register(container) {
        container.register(jwtCliResetTokenVerifier);
    }
});
