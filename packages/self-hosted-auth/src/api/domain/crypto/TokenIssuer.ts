import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { createAbstraction, createFeature } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

/**
 * The `iss` claim stamped onto every token we mint. The self-hosted
 * `JwtIdentityProvider` uses it to recognise its own tokens (the same way the
 * Cognito provider matches on the Cognito issuer URL), so this must stay stable.
 */
export const SELF_HOSTED_ISSUER = "webiny-self-hosted";

export interface IssueTokenParams {
    userId: string;
    email: string;
    displayName?: string;
}

export interface IssuedToken {
    token: string;
    /** Seconds until expiry — convenient for clients to schedule a refresh. */
    expiresIn: number;
}

export interface ITokenIssuer {
    issue(params: IssueTokenParams): Promise<IssuedToken>;
    /** Returns the verified payload, or `null` if the signature/claims are invalid. */
    verify(token: string): Promise<JwtPayload | null>;
}

/** Mints and verifies the JWTs handed out on login. We are the issuer. */
export const TokenIssuer = createAbstraction<ITokenIssuer>("TokenIssuer");

export namespace TokenIssuer {
    export type Interface = ITokenIssuer;
    export type Payload = JwtPayload;
}

/** Default token lifetime: 12 hours (seconds). */
const DEFAULT_EXPIRES_IN = 60 * 60 * 12;

class JwtTokenIssuer implements ITokenIssuer {
    private readonly secret: string;
    private readonly expiresIn: number;

    /**
     * The signing secret (HS256) is configured via `<SelfHostedAuth signingSecret={...}>` in
     * webiny.config.tsx, baked as the `SelfHostedAuthSigningSecret` build param. It MUST be set —
     * a self-hosted deployment shares one stable secret between issuer and verifier (same process
     * here). Swap for an RS256 keypair if you ever want the verifier to hold only the public key.
     */
    constructor(buildParams: BuildParams.Interface) {
        const secret = buildParams.get<string>("SelfHostedAuthSigningSecret");
        if (!secret) {
            throw new Error(
                "Self-hosted auth requires a JWT signing secret. Configure it via " +
                    "`<SelfHostedAuth signingSecret={process.env.YOUR_SECRET_ENV} />` in webiny.config.tsx."
            );
        }
        this.secret = secret;

        // Optional token lifetime override (seconds), configured via
        // `<SelfHostedAuth tokenExpiresIn={...}>`. Defaults to 12 hours.
        const expiresIn = buildParams.get<number | string>("SelfHostedAuthTokenExpiresIn");
        this.expiresIn = expiresIn ? Number(expiresIn) : DEFAULT_EXPIRES_IN;
    }

    async issue(params: IssueTokenParams): Promise<IssuedToken> {
        const token = jwt.sign(
            {
                email: params.email,
                displayName: params.displayName
            },
            this.secret,
            {
                algorithm: "HS256",
                issuer: SELF_HOSTED_ISSUER,
                subject: params.userId,
                expiresIn: this.expiresIn
            }
        );

        return { token, expiresIn: this.expiresIn };
    }

    async verify(token: string): Promise<JwtPayload | null> {
        try {
            const decoded = jwt.verify(token, this.secret, {
                algorithms: ["HS256"],
                issuer: SELF_HOSTED_ISSUER
            });

            return typeof decoded === "string" ? null : decoded;
        } catch {
            return null;
        }
    }
}

const jwtTokenIssuer = TokenIssuer.createImplementation({
    implementation: JwtTokenIssuer,
    dependencies: [BuildParams]
});

export const TokenIssuerFeature = createFeature({
    name: "TokenIssuer",
    register(container) {
        container.register(jwtTokenIssuer);
    }
});
