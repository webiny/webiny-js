import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrlsFeature } from "@webiny/api-core/features/publicUrls/index.js";
import { BuildParamsPublicUrlsFeature } from "~/publicUrls/feature.js";

const createContainer = (params: Record<string, unknown>) => {
    const container = new Container();
    container.registerInstance(BuildParams, {
        get: <T>(key: string) => (params[key] ?? null) as T | null
    });
    PublicUrlsFeature.register(container);
    BuildParamsPublicUrlsFeature.register(container);
    return container;
};

describe("BuildParamsPublicUrls", () => {
    it("reads the API and Admin URLs from build params", async () => {
        const publicUrls = createContainer({
            WEBINY_API_URL: "http://localhost:3002/",
            WEBINY_ADMIN_URL: "http://localhost:3001"
        }).resolve(PublicUrls);

        const apiUrl = await publicUrls.getApiUrl();
        const adminUrl = await publicUrls.getAdminUrl();

        expect(apiUrl.toString()).toBe("http://localhost:3002");
        expect(adminUrl.toString()).toBe("http://localhost:3001");
    });

    it("returns unknown URLs for missing or blank build params", async () => {
        const publicUrls = createContainer({ WEBINY_API_URL: "  " }).resolve(PublicUrls);

        const apiUrl = await publicUrls.getApiUrl();
        const adminUrl = await publicUrls.getAdminUrl();

        expect(apiUrl.isKnown()).toBe(false);
        expect(adminUrl.isKnown()).toBe(false);
    });
});
