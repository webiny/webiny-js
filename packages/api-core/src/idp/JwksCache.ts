import { createImplementation } from "@webiny/feature/api";
import { z } from "zod";
import type { Jwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import { HttpClient } from "~/features/httpClient/index.js";
import { JwkCache } from "./abstractions.js";
import { JwksStore } from "./abstractions.js";

// Keys older than this are fetched again, so a key the issuer removes stops verifying tokens.
const MAX_AGE_MS = 10 * 60_000;

// The shortest time between two fetches that aren't for missing keys: refreshes for unknown key
// ids, and retries after a failed fetch.
const MIN_REFETCH_INTERVAL_MS = 60_000;

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

function attemptedRecently(state: JwksStore.IssuerState): boolean {
    if (!state.lastAttemptAt) {
        return false;
    }
    return Date.now() - state.lastAttemptAt < MIN_REFETCH_INTERVAL_MS;
}

class JwksCacheImpl implements JwkCache.Interface {
    // Used when no JwksStore is registered: the keys then last for this instance only.
    private readonly states = new Map<string, JwksStore.IssuerState>();

    constructor(
        private readonly httpClient: HttpClient.Interface,
        private readonly store: JwksStore.Interface | undefined
    ) {}

    async getKeys(issuer: string): Promise<Jwk[]> {
        const state = this.getState(issuer);

        // No keys yet: fetch them, and let a failure fail the token verification.
        if (!state.keys) {
            return this.fetchKeys(issuer, state);
        }

        const age = Date.now() - (state.fetchedAt ?? 0);
        if (age < MAX_AGE_MS || attemptedRecently(state)) {
            return state.keys;
        }

        /*
         * Expired. Fetch again, but keep using the old keys if the issuer can't be reached, so an
         * outage doesn't fail every login. The failed attempt counts, so the next try waits.
         */
        try {
            return await this.fetchKeys(issuer, state);
        } catch {
            return state.keys;
        }
    }

    async refreshKeys(issuer: string): Promise<Jwk[] | null> {
        const state = this.getState(issuer);
        if (attemptedRecently(state)) {
            return null;
        }

        try {
            return await this.fetchKeys(issuer, state);
        } catch {
            return null;
        }
    }

    private getState(issuer: string): JwksStore.IssuerState {
        if (this.store) {
            return this.store.get(issuer);
        }

        let state = this.states.get(issuer);
        if (!state) {
            state = {};
            this.states.set(issuer, state);
        }
        return state;
    }

    // One fetch per issuer at a time: concurrent callers share the one in progress.
    private fetchKeys(issuer: string, state: JwksStore.IssuerState): Promise<Jwk[]> {
        if (state.pending) {
            return state.pending;
        }

        state.lastAttemptAt = Date.now();
        const pending = this.loadKeys(issuer).then(keys => {
            state.keys = keys;
            state.fetchedAt = Date.now();
            return keys;
        });
        state.pending = pending;

        const clearPending = () => {
            state.pending = undefined;
        };
        pending.then(clearPending, clearPending);

        return pending;
    }

    private async loadKeys(issuer: string): Promise<Jwk[]> {
        const openidConfigurationUrl = getOpenidConfigurationUrl(issuer);
        const oidcConfig = await this.fetchJson(openidConfigurationUrl, oidcConfigurationSchema);
        const jwksResponse = await this.fetchJson(oidcConfig.jwks_uri, jwksSchema);
        return jwksResponse.keys;
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
