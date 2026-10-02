import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "~/features/httpClient/abstractions.js";
import { HttpStatusError } from "~/features/httpClient/HttpStatusError.js";
import { JwkCache } from "~/idp/abstractions.js";
import { JwksCache } from "~/idp/JwksCache.js";

const ISSUER = "https://idp.example.com/realm";
const OPENID_CONFIGURATION_URL = "https://idp.example.com/realm/.well-known/openid-configuration";
const JWKS_URL = "https://idp.example.com/realm/jwks";
const KEYS = [{ kid: "key-1", kty: "RSA", n: "abc", e: "AQAB" }];

const createCache = (responses: Record<string, unknown>) => {
    const requestJson = vi.fn<HttpClient.Interface["requestJson"]>(async ({ url }) => {
        if (url in responses) {
            return Result.ok(responses[url]);
        }
        const error = new HttpStatusError({ url, status: 404, statusText: "", body: undefined });
        return Result.fail(error);
    });

    const container = new Container();
    container.registerInstance(HttpClient, { requestJson });
    container.register(JwksCache);

    return { cache: container.resolve(JwkCache), requestJson };
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
});
