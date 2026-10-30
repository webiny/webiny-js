import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewGateway } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewGateway/CmsReviewGateway.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/abstractions.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
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

    it("resolves the content adapter and the row provider and nothing else (R354)", () => {
        const resolved = WbReviewFeature.resolve(container);
        const keys = Object.keys(resolved).sort();

        expect(keys).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(WbReviewContentAdapter));
        expect(resolved.rowProvider).toBe(container.resolve(WbReviewRowProvider));
    });

    it("binds WbReviewGateway itself to the shared review app token, once (R347, R358)", () => {
        const gateways = container.resolveAll(ReviewAppGateway);

        expect(gateways).toHaveLength(1);
        expect(Object.getPrototypeOf(gateways[0])).toBe(WbReviewGateway.prototype);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers the gateway and the adapter as singletons", () => {
        const [firstGateway] = container.resolveAll(ReviewAppGateway);
        const [secondGateway] = container.resolveAll(ReviewAppGateway);
        const firstAdapter = container.resolve(WbReviewContentAdapter);
        const secondAdapter = container.resolve(WbReviewContentAdapter);

        expect(firstGateway).toBe(secondGateway);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("claims the page namespace only", () => {
        const [gateway] = container.resolveAll(ReviewAppGateway);

        expect(gateway.canHandle("wb.page")).toBe(true);
        expect(gateway.canHandle("cms.article")).toBe(false);
    });

    it("keeps both apps' gateways under the shared token in one container (A83, A114)", () => {
        container.register(CmsReviewGateway).inSingletonScope();

        const gateways = container.resolveAll(ReviewAppGateway);
        const apps = gateways.map(gateway => gateway.app);

        expect(apps).toEqual(["wb", "cms"]);
        expect(gateways[0]).not.toBe(gateways[1]);
    });

    it("sends the WB document and resolves with the envelope (R204)", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: { data: null, error: null } }
        });
        const [gateway] = container.resolveAll(ReviewAppGateway);

        const envelope = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(envelope).toEqual({ data: null, error: null });
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({ revisionId: "page-1#0001" });
    });
});
