import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsReviewUseCases as CmsReviewUseCasesAbstraction } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsReviewGateway } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewUseCases } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases/CmsReviewUseCases.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewGateway } from "./WbReviewGateway/abstractions.js";
import { WbReviewUseCases } from "./WbReviewUseCases/abstractions.js";
import { WbReviewFeature } from "./feature.js";

describe("WbReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbReviewFeature.register(container);
    });

    it("registers the gateway, the use cases and the adapter under the WB tokens", () => {
        const { useCases, contentAdapter } = WbReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        expect(container.resolve(WbReviewGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        const firstGateway = container.resolve(WbReviewGateway);
        const secondGateway = container.resolve(WbReviewGateway);
        const firstUseCases = container.resolve(WbReviewUseCases);
        const secondUseCases = container.resolve(WbReviewUseCases);
        const firstAdapter = container.resolve(WbReviewContentAdapter);
        const secondAdapter = container.resolve(WbReviewContentAdapter);

        expect(firstGateway).toBe(secondGateway);
        expect(firstUseCases).toBe(secondUseCases);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("registers no CMS token: the other app's use cases are unresolved", () => {
        const resolveCmsUseCases = () => container.resolve(CmsReviewUseCasesAbstraction);

        expect(resolveCmsUseCases).toThrow("No registration found");
    });

    it("runs the shared use cases over the WB gateway", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: { data: null, error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const result = await useCases.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({ revisionId: "page-1#0001" });
    });

    it("turns an envelope error into a GraphQLOperationError in the shared use cases", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: {
                getWebsiteBuilderPageReview: {
                    data: null,
                    error: { code: "Workflows/Review/NotFound", message: "No review.", data: null }
                }
            }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const promise = useCases.getReview("review-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: "Workflows/Review/NotFound" });
    });

    it("keeps both apps' tokens in one container with separate instances and caches (A83)", async () => {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
        client.execute.mockImplementation(async (request: { query: string }) => {
            if (request.query.includes("listCmsEntryWorkflows")) {
                return { cms: { listCmsEntryWorkflows: { data: [], error: null } } };
            }

            return {
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            };
        });
        const wbUseCases = container.resolve(WbReviewUseCases);
        const cmsUseCases = container.resolve(CmsReviewUseCasesAbstraction);

        expect(wbUseCases).not.toBe(cmsUseCases);

        await wbUseCases.getBoundWorkflow("wb.page");
        await wbUseCases.getBoundWorkflow("wb.page");
        await cmsUseCases.getBoundWorkflow("cms.article");
        await cmsUseCases.getBoundWorkflow("cms.article");

        expect(client.execute).toHaveBeenCalledTimes(2);
        const queries = client.execute.mock.calls.map(call => call[0].query as string);
        expect(
            queries.filter(query => query.includes("listWebsiteBuilderPageWorkflows"))
        ).toHaveLength(1);
        expect(queries.filter(query => query.includes("listCmsEntryWorkflows"))).toHaveLength(1);
    });

    it("caches the workflow list per instance, so the WB use cases load it once", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        const first = await useCases.getBoundWorkflow("wb.page");
        const second = await useCases.getBoundWorkflow("wb.page");

        expect(first).toBeNull();
        expect(second).toBeNull();
        expect(client.execute).toHaveBeenCalledTimes(1);
    });

    it("invalidates the WB workflow cache, so the next read loads the list again", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        await useCases.getBoundWorkflow("wb.page");
        useCases.invalidateWorkflows();
        await useCases.getBoundWorkflow("wb.page");

        expect(client.execute).toHaveBeenCalledTimes(2);
    });
});
