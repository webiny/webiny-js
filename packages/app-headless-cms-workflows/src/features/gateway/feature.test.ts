import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewGateway } from "./CmsReviewGateway/abstractions.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases/abstractions.js";
import { CmsReviewFeature } from "./feature.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";

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

    it("resolves the content adapter and the row provider, and no use case (R349, R354)", () => {
        const resolved = CmsReviewFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(CmsReviewContentAdapter));
        expect(container.resolve(CmsReviewGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        const gateway1 = container.resolve(CmsReviewGateway);
        const gateway2 = container.resolve(CmsReviewGateway);
        const useCases1 = container.resolve(CmsReviewUseCases);
        const useCases2 = container.resolve(CmsReviewUseCases);
        const adapter1 = container.resolve(CmsReviewContentAdapter);
        const adapter2 = container.resolve(CmsReviewContentAdapter);

        expect(gateway1).toBe(gateway2);
        expect(useCases1).toBe(useCases2);
        expect(adapter1).toBe(adapter2);
    });

    it("registers only its own bridge under the shared ReviewAppGateway token, as a singleton (R356, R362)", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryReview: { data: null, error: null } }
        });
        const appGateways = container.resolveAll(ReviewAppGateway);

        expect(appGateways).toHaveLength(1);
        expect(appGateways[0].app).toBe("cms");
        expect(appGateways[0].canHandle("cms.article")).toBe(true);
        expect(appGateways[0].canHandle("wb.page")).toBe(false);
        expect(container.resolveAll(ReviewAppGateway)[0]).toBe(appGateways[0]);

        await appGateways[0].getReview("review-1");

        expect(client.execute.mock.calls[0][0].query).toContain("getCmsEntryReview");
    });

    it("runs the shared use cases over the CMS gateway", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryTargetReview: { data: null, error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const result = await useCases.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001"
        });
    });

    it("turns an envelope error into a GraphQLOperationError in the shared use cases", async () => {
        client.execute.mockResolvedValue({
            cms: {
                getCmsEntryReview: {
                    data: null,
                    error: { code: "Workflows/Review/NotFound", message: "No review.", data: null }
                }
            }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const promise = useCases.getReview("review-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: "Workflows/Review/NotFound" });
    });

    it("caches the workflow list per instance, so the CMS use cases load it once", async () => {
        client.execute.mockResolvedValue({
            cms: { listCmsEntryWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        const first = await useCases.getBoundWorkflow("cms.article");
        const second = await useCases.getBoundWorkflow("cms.article");

        expect(first).toBeNull();
        expect(second).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
    });

    it("invalidates the CMS workflow cache, so the next read loads the list again", async () => {
        client.execute.mockResolvedValue({
            cms: { listCmsEntryWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        await useCases.getBoundWorkflow("cms.article");
        useCases.invalidateWorkflows();
        await useCases.getBoundWorkflow("cms.article");

        expect(client.execute).toHaveBeenCalledTimes(2);
    });
});
