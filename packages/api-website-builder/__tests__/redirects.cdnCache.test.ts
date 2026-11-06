import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Container } from "@webiny/di";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";

const INVALIDATED = { caller: "wb.redirects", paths: ["/wb/redirects"] };

const setup = () => {
    const invalidate = vi.fn(async () => {});
    const handler = useGraphQlHandler({
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(CdnCache, { invalidate });
            }
        ]
    });
    return { handler, invalidate };
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
