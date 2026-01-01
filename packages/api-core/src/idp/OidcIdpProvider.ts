import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { isJwt } from "~/features/security/utils/isJwt.js";
import { verifyJwtUsingJwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";
import type { IOidcIdpConfig } from "./abstractions.js";
import type { JwksCache } from "./JwksCache.js";

export interface OidcIdpProviderConfig {
    issuer: string;
    clientId?: string;
    config: IOidcIdpConfig;
    isApplicable: (token: JwtPayload) => boolean;
}

export class OidcIdpProvider {
    constructor(
        private providerConfig: OidcIdpProviderConfig,
        private jwksCache: JwksCache
    ) {}

    isApplicable(token: JwtPayload): boolean {
        return this.providerConfig.isApplicable(token);
    }

    async getIdentity(token: string): Promise<IdentityData | null> {
        // Validate token is JWT
        if (!isJwt(token)) {
            return null;
        }

        // Decode JWT to get header and payload
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) {
            return null;
        }

        const { header, payload } = decoded;

        if (typeof payload === "string") {
            return null;
        }

        // Verify issuer from payload
        const issuer = payload.iss;
        if (!issuer || !issuer.startsWith(this.providerConfig.issuer)) {
            return null;
        }

        // Fetch JWKs from cache
        const jwks = await this.jwksCache.getJwks(issuer);

        // Find matching JWK using header.kid
        const jwk = jwks.find(key => key.kid === header.kid);
        if (!jwk) {
            return null;
        }

        // Verify token using JWK
        let verifiedPayload: JwtPayload;
        if (this.providerConfig.config.verifyToken) {
            verifiedPayload = await this.providerConfig.config.verifyToken(token);
        } else {
            verifiedPayload = await verifyJwtUsingJwk(token, jwk);
        }

        // Call verifyTokenClaims if provided
        if (this.providerConfig.config.verifyTokenClaims) {
            verifiedPayload = await this.providerConfig.config.verifyTokenClaims(verifiedPayload);
        }

        // Call config.getIdentity to get IdentityData
        const identity = await this.providerConfig.config.getIdentity(verifiedPayload);

        console.log("identity", identity);

        return identity;
    }
}
