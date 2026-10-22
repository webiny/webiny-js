import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    ServiceDiscovery,
    type IServiceManifest
} from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { WorkflowsAdminUrlServiceFeature } from "~/features/notifications/WorkflowsAdminUrlService/feature.js";

const setupService = async (manifests: IServiceManifest[] | undefined | Error) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            WorkflowsAdminUrlServiceFeature.register(container);
        }
    });
    // The test handler boots api-core, which installs its own loader: set ours after it.
    ServiceDiscovery.clear();
    ServiceDiscovery.setLoader({
        load: async () => {
            if (manifests instanceof Error) {
                throw manifests;
            }
            return manifests;
        }
    });
    return context.container.resolve(WorkflowsAdminUrlService);
};

describe("WorkflowsAdminUrlService (R195)", () => {
    beforeEach(() => {
        ServiceDiscovery.clear();
        loggedErrors.length = 0;
    });

    afterEach(() => {
        ServiceDiscovery.clear();
    });

    it("is https plus the admin CloudFront domain", async () => {
        const service = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "d1234.cloudfront.net" } } },
            { name: "api", manifest: { cloudfront: { domain: "api.cloudfront.net" } } }
        ]);

        expect(await service.get()).toBe("https://d1234.cloudfront.net");
    });

    it("has no trailing slash", async () => {
        const service = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "admin.example.com/" } } }
        ]);

        expect(await service.get()).toBe("https://admin.example.com");
    });

    it("is null when there is no manifest", async () => {
        const service = await setupService(undefined);

        expect(await service.get()).toBeNull();
    });

    it("is null when the manifest has no admin entry", async () => {
        const service = await setupService([
            { name: "api", manifest: { cloudfront: { domain: "api.cloudfront.net" } } }
        ]);

        expect(await service.get()).toBeNull();
    });

    it("is null when the admin entry has no CloudFront domain", async () => {
        const withoutCloudfront = await setupService([{ name: "admin", manifest: {} }]);
        expect(await withoutCloudfront.get()).toBeNull();

        ServiceDiscovery.clear();
        const blankDomain = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "  " } } }
        ]);
        expect(await blankDomain.get()).toBeNull();

        ServiceDiscovery.clear();
        const notAString = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: 42 } } }
        ]);
        expect(await notAString.get()).toBeNull();
    });

    it("is null, does not reject and does not log when the loader throws", async () => {
        const service = await setupService(new Error("The manifest could not be loaded."));

        expect(await service.get()).toBeNull();
        expect(loggedErrors).toEqual([]);
    });
});
