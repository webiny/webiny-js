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
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";
import { CmsReviewGateway } from "./CmsReviewGateway.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases.js";
import { CmsReviewFeature } from "./feature.js";

describe("CmsReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));
        CmsReviewFeature.register(container);
    });

    it("registers the gateway, the use cases and the adapter under the CMS tokens", () => {
        const { useCases, contentAdapter } = CmsReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        expect(container.resolve(CmsReviewGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(CmsReviewGateway)).toBe(container.resolve(CmsReviewGateway));
        expect(container.resolve(CmsReviewUseCases)).toBe(container.resolve(CmsReviewUseCases));
        expect(container.resolve(CmsReviewContentAdapter)).toBe(
            container.resolve(CmsReviewContentAdapter)
        );
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
});
