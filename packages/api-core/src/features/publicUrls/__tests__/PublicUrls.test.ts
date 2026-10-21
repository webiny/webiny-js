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

    it("returns null by default", async () => {
        const publicUrls = container.resolve(PublicUrls);

        expect(await publicUrls.getApiUrl()).toBeNull();
        expect(await publicUrls.getAdminUrl()).toBeNull();
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

            expect(await publicUrls.getApiUrl()).toBe("https://api.example.com");
            expect(await publicUrls.getAdminUrl()).toBe("https://admin.example.com");
        });

        it("returns null for the Admin URL before the Admin app is deployed", async () => {
            withManifests([{ name: "api", manifest: { url: "https://api.example.com" } }]);

            const publicUrls = container.resolve(PublicUrls);

            expect(await publicUrls.getApiUrl()).toBe("https://api.example.com");
            expect(await publicUrls.getAdminUrl()).toBeNull();
        });

        it("returns null when there are no manifests", async () => {
            ServiceDiscovery.clear();
            ServiceDiscovery.setLoader({ load: async () => undefined });

            const publicUrls = container.resolve(PublicUrls);

            expect(await publicUrls.getApiUrl()).toBeNull();
            expect(await publicUrls.getAdminUrl()).toBeNull();
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

            expect(await publicUrls.getApiUrl()).toBe("http://localhost:3002");
            expect(await publicUrls.getAdminUrl()).toBe("http://localhost:3001");
        });

        it("returns null for missing or empty build params", async () => {
            withBuildParams(container, { WEBINY_API_URL: "  " });

            const publicUrls = container.resolve(PublicUrls);

            expect(await publicUrls.getApiUrl()).toBeNull();
            expect(await publicUrls.getAdminUrl()).toBeNull();
        });
    });
});
