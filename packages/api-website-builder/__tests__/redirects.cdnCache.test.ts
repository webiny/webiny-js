import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";

class TestInvalidationError extends BaseError {
    override readonly code = "Test/InvalidationFailed" as const;

    constructor() {
        super({ message: "The CDN rejected the invalidation." });
    }
}

const setup = (invalidate: CdnCache.Interface["invalidate"]) => {
    const logger = new NullLogger();
    const error = vi.spyOn(logger, "error");
    const handler = useGraphQlHandler({
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(CdnCache, { invalidate });
                container.registerInstance(Logger, logger);
            }
        ]
    });
    return { handler, error };
};

describe("Redirects and the CDN cache", () => {
    // No CdnCache is registered here, as on a standalone project, so api-core's default is used.
    it("creates an enabled redirect when the deployment has no CDN", async () => {
        const handler = useGraphQlHandler({});

        const [response] = await handler.wb.createRedirect({ data: redirectMocks.redirectA });

        expect(response.data.websiteBuilder.createRedirect.error).toBeNull();
        expect(response.data.websiteBuilder.createRedirect.data.id).toEqual(expect.any(String));
    });

    it("asks the CDN cache to drop /wb/redirects after an enabled redirect is created", async () => {
        const invalidate = vi.fn(async () => Result.ok());
        const { handler } = setup(invalidate);

        await handler.wb.createRedirect({ data: redirectMocks.redirectA });

        expect(invalidate).toHaveBeenCalledWith({
            caller: "wb.redirects",
            paths: ["/wb/redirects"]
        });
    });

    it("keeps the redirect and logs the error when the invalidation fails", async () => {
        const { handler, error } = setup(async () => Result.fail(new TestInvalidationError()));

        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.websiteBuilder.createRedirect.data;
        const [deleteResponse] = await handler.wb.deleteRedirect({ id: redirect.id });

        expect(createResponse.data.websiteBuilder.createRedirect.error).toBeNull();
        expect(deleteResponse.data.websiteBuilder.deleteRedirect.error).toBeNull();
        expect(error).toHaveBeenCalledTimes(2);
        expect(error).toHaveBeenCalledWith(
            { error: expect.any(TestInvalidationError) },
            "Could not invalidate the redirects cache."
        );
    });
});
