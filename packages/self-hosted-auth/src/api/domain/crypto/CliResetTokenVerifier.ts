import { createAbstraction, createFeature } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { verifyCliResetToken, type CliResetTokenClaims } from "~/shared/cliResetToken.js";
import { SIGNING_SECRET_BUILD_PARAM } from "~/shared/buildParams.js";

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

    constructor(buildParams: BuildParams.Interface) {
        // Same secret as login tokens. It is guaranteed to be set, because `TokenIssuer`
        // refuses to construct without it, so an empty value here means the whole module is
        // misconfigured, and `verify` failing closed is the right outcome.
        this.secret = buildParams.get<string>(SIGNING_SECRET_BUILD_PARAM) ?? "";
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
    dependencies: [BuildParams]
});

export const CliResetTokenVerifierFeature = createFeature({
    name: "CliResetTokenVerifier",
    register(container) {
        container.register(jwtCliResetTokenVerifier);
    }
});
