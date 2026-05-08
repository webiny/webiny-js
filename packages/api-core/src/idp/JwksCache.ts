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

export class JwksCache implements JwkCache.Interface {
    private cache = new Map<string, CacheEntry>();

    async getKeys(issuer: string, jwksUrl?: string): Promise<Jwk[]> {
        // Check cache first
        const cached = this.cache.get(issuer);
        if (cached) {
            return cached.jwks;
        }

        let jwksUri: string;
        let oidcConfig: OidcConfiguration;
        if (jwksUrl) {
            // Caller provided an explicit JWKS URL — skip discovery. Useful
            // when the issuer claim points at a URL that's only reachable
            // by the user (e.g., browser sees `localhost:8180`) but the
            // API needs an in-network address (e.g., `keycloak:8080`).
            jwksUri = jwksUrl;
            oidcConfig = { jwks_uri: jwksUri };
        } else {
            // Fetch OIDC configuration
            const openidUrl = new URL(issuer);
            const pathname = openidUrl.pathname + "/.well-known/openid-configuration";
            openidUrl.pathname = pathname.replace(/\/+/g, "/");

            oidcConfig = await fetch(openidUrl.toString()).then(
                res => res.json() as Promise<OidcConfiguration>
            );
            jwksUri = oidcConfig.jwks_uri;
        }

        // Fetch JWKs from jwks_uri
        const jwksResponse = await fetch(jwksUri).then(res => res.json());
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
