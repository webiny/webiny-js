import type { Jwk } from "~/features/security/utils/verifyJwtUsingJwk.js";

interface OidcConfiguration {
    jwks_uri: string;
    [key: string]: any;
}

interface CacheEntry {
    oidcConfig: OidcConfiguration;
    jwks: Jwk[];
}

export class JwksCache {
    private cache = new Map<string, CacheEntry>();

    async getJwks(issuer: string): Promise<Jwk[]> {
        // Check cache first
        const cached = this.cache.get(issuer);
        if (cached) {
            return cached.jwks;
        }

        // Fetch OIDC configuration
        const oidcConfigUrl = `${issuer}/.well-known/openid-configuration`;
        const oidcConfig = await fetch(oidcConfigUrl).then(
            res => res.json() as Promise<OidcConfiguration>
        );

        // Fetch JWKs from jwks_uri
        const jwksResponse = await fetch(oidcConfig.jwks_uri).then(res => res.json());
        const jwks = jwksResponse.keys as Jwk[];

        // Cache both config and JWKs
        this.cache.set(issuer, {
            oidcConfig,
            jwks
        });

        return jwks;
    }

    clearCache(): void {
        this.cache.clear();
    }
}

// Global singleton instance to survive Lambda warm starts
export const jwksCache = new JwksCache();
