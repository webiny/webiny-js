import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Container } from "@webiny/di";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";

const INVALIDATED = { caller: "wb.redirects", paths: ["/wb/redirects"] };

const CDN_CACHE_CONTROL = "public, max-age=31536000";

const setup = () => {
    const invalidate = vi.fn(async () => {});
    const getCacheControl = () => CDN_CACHE_CONTROL;
    const handler = useGraphQlHandler({
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(CdnCache, { invalidate, getCacheControl });
            }
        ]
    });
    return { handler, invalidate };
};

const getRedirects = async (handler: ReturnType<typeof useGraphQlHandler>["handler"]) => {
    return await handler({
        method: "GET",
        path: "/wb/redirects",
        headers: { "x-tenant": "root" }
    });
};

describe("Redirects and the CDN cache", () => {
    // No CdnCache is registered here, as on a standalone project, so api-core's default is used.
    it("creates an enabled redirect when the deployment has no CDN", async () => {
        const handler = useGraphQlHandler({});

        const [response] = await handler.wb.createRedirect({ data: redirectMocks.redirectA });

        expect(response.data.websiteBuilder.createRedirect.error).toBeNull();
        expect(response.data.websiteBuilder.createRedirect.data.id).toEqual(expect.any(String));
    });

    it("asks the CDN cache to drop /wb/redirects when an enabled redirect is created and deleted", async () => {
        const { handler, invalidate } = setup();

        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.websiteBuilder.createRedirect.data;
        await handler.wb.deleteRedirect({ id: redirect.id });

        expect(invalidate).toHaveBeenCalledTimes(2);
        expect(invalidate).toHaveBeenNthCalledWith(1, INVALIDATED);
        expect(invalidate).toHaveBeenNthCalledWith(2, INVALIDATED);
    });
});

describe("The Cache-Control header on /wb/redirects", () => {
    // Nothing invalidates a cache in front of a standalone API, so it must check back every time.
    it("tells caches to revalidate when the deployment has no CDN", async () => {
        const { handler } = useGraphQlHandler({});

        const response = await getRedirects(handler);

        expect(response.statusCode).toEqual(200);
        expect(response.headers["cache-control"]).toEqual("no-cache");
    });

    it("uses the CDN cache's header when the deployment has a CDN", async () => {
        const { handler } = setup();

        const response = await getRedirects(handler.handler);

        expect(response.statusCode).toEqual(200);
        expect(response.headers["cache-control"]).toEqual(CDN_CACHE_CONTROL);
    });
});
