import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider/abstractions.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewFeature } from "./feature.js";

describe("CmsReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        const modelsCache = new ListCache<CmsModel>("modelId");
        container.registerInstance(ModelsCache, modelsCache);
        CmsReviewFeature.register(container);
    });

    it("resolves the content adapter and the row provider and nothing else (R354)", () => {
        const resolved = CmsReviewFeature.resolve(container);
        const keys = Object.keys(resolved).sort();

        expect(keys).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(CmsReviewContentAdapter));
        expect(resolved.rowProvider).toBe(container.resolve(CmsReviewRowProvider));
    });

    it("binds CmsReviewGateway itself to the shared review app token, once (R347, R358)", () => {
        const gateways = container.resolveAll(ReviewAppGateway);

        expect(gateways).toHaveLength(1);
        expect(Object.getPrototypeOf(gateways[0])).toBe(CmsReviewGateway.prototype);
        expect(gateways[0].app).toBe("cms");
    });

    it("registers the gateway and the adapter as singletons", () => {
        const [firstGateway] = container.resolveAll(ReviewAppGateway);
        const [secondGateway] = container.resolveAll(ReviewAppGateway);
        const firstAdapter = container.resolve(CmsReviewContentAdapter);
        const secondAdapter = container.resolve(CmsReviewContentAdapter);

        expect(firstGateway).toBe(secondGateway);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("claims the CMS namespaces only", () => {
        const [gateway] = container.resolveAll(ReviewAppGateway);

        expect(gateway.canHandle("cms.article")).toBe(true);
        expect(gateway.canHandle("wb.page")).toBe(false);
    });

    it("sends the CMS document and resolves with the envelope (R204)", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryTargetReview: { data: null, error: null } }
        });
        const [gateway] = container.resolveAll(ReviewAppGateway);

        const envelope = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(envelope).toEqual({ data: null, error: null });
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001"
        });
    });
});
