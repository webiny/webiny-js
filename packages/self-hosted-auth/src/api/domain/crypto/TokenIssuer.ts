import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { createAbstraction, createFeature } from "@webiny/feature/api";

/**
 * The `iss` claim stamped onto every token we mint. The self-hosted
 * `JwtIdentityProvider` uses it to recognise its own tokens (the same way the
 * Cognito provider matches on the Cognito issuer URL), so this must stay stable.
 */
export const SELF_HOSTED_ISSUER = "webiny-self-hosted";

export interface IssueTokenParams {
    userId: string;
    email: string;
    tenant: string;
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

export interface TokenIssuerConfig {
    /**
     * Signing secret (HS256). MUST be provided in production — a self-hosted
     * deployment sets this once and shares it between the issuer and verifier
     * (same process here). Swap for an RS256 keypair if you ever want the
     * verifier to hold only the public key.
     */
    secret: string;
    /** Token lifetime in seconds. Defaults to 12 hours. */
    expiresIn?: number;
}

class JwtTokenIssuer implements ITokenIssuer {
    private readonly secret: string;
    private readonly expiresIn: number;

    constructor(config: TokenIssuerConfig) {
        this.secret = config.secret;
        this.expiresIn = config.expiresIn ?? 60 * 60 * 12;
    }

    async issue(params: IssueTokenParams): Promise<IssuedToken> {
        const token = jwt.sign(
            {
                email: params.email,
                tenant: params.tenant,
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

export const TokenIssuerFeature = createFeature<TokenIssuerConfig>({
    name: "TokenIssuer",
    register(container, config) {
        container.registerInstance(TokenIssuer, new JwtTokenIssuer(config));
    }
});
