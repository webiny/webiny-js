import type { Jwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import { JwkCache } from "./abstractions.js";

interface OidcConfiguration {
    jwks_uri: string;
    [key: string]: any;
}

interface CacheEntry {
    oidcConfig: OidcConfiguration;
    jwks: Jwk[];
}

export class JwksCache implements JwkCache.Interface{
    private cache = new Map<string, CacheEntry>();

    async getKeys(issuer: string): Promise<Jwk[]> {
        // Check cache first
        const cached = this.cache.get(issuer);
        if (cached) {
            return cached.jwks;
        }

        // Fetch OIDC configuration
        const openidUrl = new URL(issuer);
        const pathname = openidUrl.pathname + "/.well-known/openid-configuration";
        openidUrl.pathname = pathname.replace(/\/+/g, "/");

        const oidcConfig = await fetch(openidUrl.toString()).then(
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
