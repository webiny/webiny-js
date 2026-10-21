import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/feature/api";
import { PublicUrls, PublicUrlsFeature } from "@webiny/api-core/features/publicUrls/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { ManifestPublicUrlsFeature } from "~/publicUrls/feature.js";

const withManifests = (
    manifests: Array<{ name: string; manifest: Record<string, any> }> | undefined
) => {
    ServiceDiscovery.clear();
    ServiceDiscovery.setLoader({ load: async () => manifests });
};

describe("ManifestPublicUrls", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        PublicUrlsFeature.register(container);
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
        withManifests(undefined);

        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
        expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
    });
});
