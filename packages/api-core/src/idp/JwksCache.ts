import { createImplementation } from "@webiny/feature/api";
import { z } from "zod";
import type { Jwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import { HttpClient } from "~/features/httpClient/index.js";
import { JwkCache } from "./abstractions.js";

const oidcConfigurationSchema = z.object({
    jwks_uri: z.string()
});

const jwksSchema = z.object({
    keys: z.array(z.looseObject({ kid: z.string().optional() }))
});

function getOpenidConfigurationUrl(issuer: string): string {
    const openidUrl = new URL(issuer);
    const pathname = openidUrl.pathname + "/.well-known/openid-configuration";
    openidUrl.pathname = pathname.replace(/\/+/g, "/");
    return openidUrl.toString();
}

class JwksCacheImpl implements JwkCache.Interface {
    private cache = new Map<string, Jwk[]>();

    constructor(private readonly httpClient: HttpClient.Interface) {}

    async getKeys(issuer: string): Promise<Jwk[]> {
        const cached = this.cache.get(issuer);
        if (cached) {
            return cached;
        }

        const openidConfigurationUrl = getOpenidConfigurationUrl(issuer);
        const oidcConfig = await this.fetchJson(openidConfigurationUrl, oidcConfigurationSchema);
        const jwksResponse = await this.fetchJson(oidcConfig.jwks_uri, jwksSchema);
        const jwks: Jwk[] = jwksResponse.keys;

        this.cache.set(issuer, jwks);

        return jwks;
    }

    // Throws, so a failed fetch fails the token verification instead of caching a bad answer.
    private async fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
        const response = await this.httpClient.requestJson({ url });
        if (response.isFail()) {
            throw response.error;
        }

        const result = schema.safeParse(response.value);
        if (!result.success) {
            throw new Error(`Invalid response from "${url}": ${result.error.message}`);
        }

        return result.data;
    }
}

export const JwksCache = createImplementation({
    abstraction: JwkCache,
    implementation: JwksCacheImpl,
    dependencies: [HttpClient]
});
