import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "~/features/buildParams/index.js";
import { ServiceDiscovery } from "~/features/serviceDiscovery/index.js";
import {
    BuildParamsPublicUrlsFeature,
    ManifestPublicUrlsFeature,
    PublicUrls,
    PublicUrlsFeature
} from "../index.js";

const withManifests = (manifests: Array<{ name: string; manifest: Record<string, any> }>) => {
    ServiceDiscovery.clear();
    ServiceDiscovery.setLoader({ load: async () => manifests });
};

const withBuildParams = (container: Container, params: Record<string, unknown>) => {
    container.registerInstance(BuildParams, {
        get: <T>(key: string) => (params[key] ?? null) as T | null
    });
};

describe("PublicUrls", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        PublicUrlsFeature.register(container);
    });

    it("returns unknown URLs by default", async () => {
        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
        expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
    });

    describe("manifest (AWS)", () => {
        beforeEach(() => {
            ManifestPublicUrlsFeature.register(container);
        });

        it("reads the API and Admin URLs from the service manifest", async () => {
            withManifests([
                { name: "api", manifest: { url: "https://api.example.com/" } },
                { name: "admin", manifest: { url: "https://admin.example.com" } }
            ]);

            const publicUrls = container.resolve(PublicUrls);

            expect((await publicUrls.getApiUrl()).toString()).toBe("https://api.example.com");
            expect((await publicUrls.getAdminUrl()).toString()).toBe("https://admin.example.com");
        });

        it("returns an unknown Admin URL before the Admin app is deployed", async () => {
            withManifests([{ name: "api", manifest: { url: "https://api.example.com" } }]);

            const publicUrls = container.resolve(PublicUrls);

            expect((await publicUrls.getApiUrl()).toString()).toBe("https://api.example.com");
            expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
        });

        it("returns unknown URLs when there are no manifests", async () => {
            ServiceDiscovery.clear();
            ServiceDiscovery.setLoader({ load: async () => undefined });

            const publicUrls = container.resolve(PublicUrls);

            expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
            expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
        });
    });

    describe("build params (standalone)", () => {
        beforeEach(() => {
            BuildParamsPublicUrlsFeature.register(container);
        });

        it("reads the API and Admin URLs from build params", async () => {
            withBuildParams(container, {
                WEBINY_API_URL: "http://localhost:3002/",
                WEBINY_ADMIN_URL: "http://localhost:3001"
            });

            const publicUrls = container.resolve(PublicUrls);

            expect((await publicUrls.getApiUrl()).toString()).toBe("http://localhost:3002");
            expect((await publicUrls.getAdminUrl()).toString()).toBe("http://localhost:3001");
        });

        it("returns unknown URLs for missing or empty build params", async () => {
            withBuildParams(container, { WEBINY_API_URL: "  " });

            const publicUrls = container.resolve(PublicUrls);

            expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
            expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
        });
    });
});
