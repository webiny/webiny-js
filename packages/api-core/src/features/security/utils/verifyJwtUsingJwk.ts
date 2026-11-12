import jwt from "jsonwebtoken";
import { exportSPKI, importJWK, type JWK } from "jose";

export type Jwk = JWK;

export type Jwt = {
    header: jwt.JwtHeader;
    payload: jwt.JwtPayload;
};

export interface VerifyJwtUsingJwkOptions {
    /**
     * Expected `iss` claim. Compared ignoring trailing slashes (Auth0 issues `https://x.auth0.com/`).
     * Skipped when not configured.
     */
    issuer?: string;
    /**
     * Expected `aud` claim (the client ID). Skipped when not configured.
     */
    audience?: string;
}

/**
 * Providers read their config with `String(process.env.X)`, so a missing value becomes "undefined".
 */
export const isConfiguredJwtOption = (value: string | undefined | null): value is string => {
    if (typeof value !== "string") {
        return false;
    }
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "undefined" && trimmed !== "null";
};

const normalizeIssuer = (value: string) => value.trim().replace(/\/+$/, "");

export const verifyJwtUsingJwk = async (
    token: string,
    jwk: Jwk,
    options: VerifyJwtUsingJwkOptions = {}
) => {
    // Casting to `any` because `jose` v5 has some incompatibilities with types.
    // v6 works as expected, but we can't have v6 because it's ESM-only.
    const key = (await importJWK(jwk, "RS256")) as CryptoKey;
    const pemKey = await exportSPKI(key);

    // Security: pin the algorithm and, when configured, the audience, so a token minted for
    // another application of the same IdP tenant / user pool is not accepted.
    const verifyOptions: jwt.VerifyOptions & { complete?: false } = {
        algorithms: ["RS256"]
    };
    if (isConfiguredJwtOption(options.audience)) {
        verifyOptions.audience = options.audience.trim();
    }

    const payload = jwt.verify(token, pemKey, verifyOptions);
    if (!payload || typeof payload === "string") {
        throw new jwt.JsonWebTokenError("jwt payload is not an object");
    }

    if (isConfiguredJwtOption(options.issuer)) {
        const tokenIssuer = typeof payload.iss === "string" ? normalizeIssuer(payload.iss) : "";
        if (tokenIssuer !== normalizeIssuer(options.issuer)) {
            throw new jwt.JsonWebTokenError(`jwt issuer invalid. expected: ${options.issuer}`);
        }
    }

    return payload;
};
