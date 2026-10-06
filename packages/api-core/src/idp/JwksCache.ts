import { createImplementation } from "@webiny/feature/api";
import { z } from "zod";
import type { Jwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import { HttpClient } from "~/features/httpClient/index.js";
import { JwkCache } from "./abstractions.js";
import { JwksStore } from "./abstractions.js";

// How long fetched keys are trusted before an unknown key id may fetch them again.
const MIN_REFRESH_INTERVAL_MS = 60_000;

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
    // Used when no JwksStore is registered: the keys then last for this instance only.
    private readonly entries = new Map<string, JwksStore.Entry>();

    constructor(
        private readonly httpClient: HttpClient.Interface,
        private readonly store: JwksStore.Interface | undefined
    ) {}

    async getKeys(issuer: string): Promise<Jwk[]> {
        const entry = this.getEntry(issuer);
        if (entry) {
            return entry.keys;
        }

        const fetched = await this.fetchKeys(issuer);
        return fetched.keys;
    }

    async refreshKeys(issuer: string): Promise<Jwk[] | null> {
        const entry = this.getEntry(issuer);
        if (entry && Date.now() - entry.fetchedAt < MIN_REFRESH_INTERVAL_MS) {
            return null;
        }

        const fetched = await this.fetchKeys(issuer);
        return fetched.keys;
    }

    private getEntry(issuer: string): JwksStore.Entry | undefined {
        if (this.store) {
            return this.store.get(issuer);
        }
        return this.entries.get(issuer);
    }

    private async fetchKeys(issuer: string): Promise<JwksStore.Entry> {
        const openidConfigurationUrl = getOpenidConfigurationUrl(issuer);
        const oidcConfig = await this.fetchJson(openidConfigurationUrl, oidcConfigurationSchema);
        const jwksResponse = await this.fetchJson(oidcConfig.jwks_uri, jwksSchema);
        const entry: JwksStore.Entry = { keys: jwksResponse.keys, fetchedAt: Date.now() };

        if (this.store) {
            this.store.set(issuer, entry);
        } else {
            this.entries.set(issuer, entry);
        }

        return entry;
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
    dependencies: [HttpClient, [JwksStore, { optional: true }]]
});
