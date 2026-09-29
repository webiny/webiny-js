import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getRenderCacheKey } from "~/services/GetProjectConfigService/getRenderCacheKey.js";

const originalLicense = process.env.WCP_PROJECT_LICENSE;

describe("getRenderCacheKey", () => {
    afterEach(() => {
        if (originalLicense === undefined) {
            delete process.env.WCP_PROJECT_LICENSE;
        } else {
            process.env.WCP_PROJECT_LICENSE = originalLicense;
        }
    });

    // A project that isn't linked to WCP never gets a license, so its second read of the config
    // during SDK setup must be a cache hit rather than a second render.
    it("gives the same key when there is no license, however often it's asked", () => {
        delete process.env.WCP_PROJECT_LICENSE;

        expect(getRenderCacheKey(undefined)).toBe(getRenderCacheKey(undefined));
    });

    // The license is fetched after the first render, and license-gated flags change what the config
    // contains. If the key ignored it, the SDK would keep using the config rendered without it.
    it("gives a different key once a license has been set", () => {
        delete process.env.WCP_PROJECT_LICENSE;
        const beforeLicense = getRenderCacheKey(undefined);

        process.env.WCP_PROJECT_LICENSE = "eyJvcmdJZCI6Im9yZyJ9";
        const withLicense = getRenderCacheKey(undefined);

        expect(withLicense).not.toBe(beforeLicense);
    });

    it("gives a different key for a different license", () => {
        process.env.WCP_PROJECT_LICENSE = "license-one";
        const first = getRenderCacheKey(undefined);

        process.env.WCP_PROJECT_LICENSE = "license-two";
        const second = getRenderCacheKey(undefined);

        expect(first).not.toBe(second);
    });

    // Build and watch pass their params as render args so that each gets its own config.
    it("still separates renders with different render args", () => {
        delete process.env.WCP_PROJECT_LICENSE;

        expect(getRenderCacheKey({ app: "admin" })).not.toBe(getRenderCacheKey({ app: "api" }));
        expect(getRenderCacheKey({ app: "admin" })).not.toBe(getRenderCacheKey(undefined));
    });

    it("never puts the license itself in the key", () => {
        process.env.WCP_PROJECT_LICENSE = "a-secret-looking-license-value";

        expect(getRenderCacheKey(undefined)).not.toContain("a-secret-looking-license-value");
    });
});
