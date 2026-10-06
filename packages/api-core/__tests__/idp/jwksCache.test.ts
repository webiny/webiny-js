import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "~/features/httpClient/abstractions.js";
import { HttpStatusError } from "~/features/httpClient/HttpStatusError.js";
import { JwkCache } from "~/idp/abstractions.js";
import { JwksCache } from "~/idp/JwksCache.js";
import { JwksStoreFeature } from "~/idp/JwksStoreFeature.js";

const ISSUER = "https://idp.example.com/realm";
const OPENID_CONFIGURATION_URL = "https://idp.example.com/realm/.well-known/openid-configuration";
const JWKS_URL = "https://idp.example.com/realm/jwks";
const KEYS = [{ kid: "key-1", kty: "RSA", n: "abc", e: "AQAB" }];

const createRequestJson = (responses: Record<string, unknown>) => {
    return vi.fn<HttpClient.Interface["requestJson"]>(async ({ url }) => {
        if (url in responses) {
            return Result.ok(responses[url]);
        }
        const error = new HttpStatusError({ url, status: 404, statusText: "", body: undefined });
        return Result.fail(error);
    });
};

const createCache = (responses: Record<string, unknown>) => {
    const requestJson = createRequestJson(responses);

    const container = new Container();
    container.registerInstance(HttpClient, { requestJson });
    container.register(JwksCache);

    return { cache: container.resolve(JwkCache), requestJson };
};

// A root container with the store, and a factory for per-request caches below it.
const createRootWithStore = (responses: Record<string, unknown>) => {
    const requestJson = createRequestJson(responses);

    const root = new Container();
    JwksStoreFeature.register(root);

    const createRequestCache = () => {
        const request = root.createChildContainer();
        request.registerInstance(HttpClient, { requestJson });
        request.register(JwksCache).inSingletonScope();
        return request.resolve(JwkCache);
    };

    return { createRequestCache, requestJson };
};

const RESPONSES = {
    [OPENID_CONFIGURATION_URL]: { jwks_uri: JWKS_URL },
    [JWKS_URL]: { keys: KEYS }
};

describe("JwksCache", () => {
    it("fetches the keys through the issuer's OpenID configuration and caches them", async () => {
        const { cache, requestJson } = createCache({
            [OPENID_CONFIGURATION_URL]: { jwks_uri: JWKS_URL },
            [JWKS_URL]: { keys: KEYS }
        });

        await expect(cache.getKeys(ISSUER)).resolves.toEqual(KEYS);
        await expect(cache.getKeys(ISSUER)).resolves.toEqual(KEYS);

        expect(requestJson).toHaveBeenCalledTimes(2);
    });

    it("throws and caches nothing when a request fails", async () => {
        const { cache, requestJson } = createCache({
            [OPENID_CONFIGURATION_URL]: { jwks_uri: JWKS_URL }
        });

        await expect(cache.getKeys(ISSUER)).rejects.toBeInstanceOf(HttpStatusError);
        await expect(cache.getKeys(ISSUER)).rejects.toBeInstanceOf(HttpStatusError);

        expect(requestJson).toHaveBeenCalledTimes(4);
    });

    it("throws when the keys response is invalid", async () => {
        const { cache } = createCache({
            [OPENID_CONFIGURATION_URL]: { jwks_uri: JWKS_URL },
            [JWKS_URL]: { nope: true }
        });

        await expect(cache.getKeys(ISSUER)).rejects.toThrow(`Invalid response from "${JWKS_URL}"`);
    });

    it("keeps the keys across requests when a JwksStore is registered in the root", async () => {
        const { createRequestCache, requestJson } = createRootWithStore(RESPONSES);

        const first = createRequestCache();
        const second = createRequestCache();
        await expect(first.getKeys(ISSUER)).resolves.toEqual(KEYS);
        await expect(second.getKeys(ISSUER)).resolves.toEqual(KEYS);

        // One OpenID configuration request and one keys request, for both requests together.
        expect(requestJson).toHaveBeenCalledTimes(2);
    });

    it("refreshes the keys at most once a minute", async () => {
        vi.useFakeTimers();
        try {
            const { createRequestCache, requestJson } = createRootWithStore(RESPONSES);
            const cache = createRequestCache();
            await cache.getKeys(ISSUER);

            const tooSoon = await cache.refreshKeys(ISSUER);
            expect(tooSoon).toBeNull();
            expect(requestJson).toHaveBeenCalledTimes(2);

            vi.advanceTimersByTime(60_001);
            const refreshed = await createRequestCache().refreshKeys(ISSUER);
            expect(refreshed).toEqual(KEYS);
            expect(requestJson).toHaveBeenCalledTimes(4);
        } finally {
            vi.useRealTimers();
        }
    });
});
