import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { PageBeforePublishEventHandler } from "~/features/pages/PublishPage/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

interface PublishBlockedByTestData {
    pageId: string;
}

/** Stands in for a before-publish rule such as the workflows one (A26). */
class PublishBlockedByTestError extends BaseError<PublishBlockedByTestData> {
    override readonly code = "Test/Page/PublishBlocked" as const;

    constructor(data: PublishBlockedByTestData) {
        super({ message: "Publishing is blocked by a test rule.", data });
    }
}

class BlockingBeforePublishHandler implements PageBeforePublishEventHandler.Interface {
    public async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        throw new PublishBlockedByTestError({ pageId: event.payload.page.id });
    }
}

const blockPublish = (container: Container) => {
    container.register(
        PageBeforePublishEventHandler.createImplementation({
            implementation: BlockingBeforePublishHandler,
            dependencies: []
        })
    );
};

describe("Page resolvers keep the error code and data (R103)", () => {
    it("returns the use case's NotAuthorized code from publishPage and unpublishPage", async () => {
        const handler = useGraphQlHandler({ permissions: [] });

        const [published] = await handler.wb.publishPage({ id: "any-page#0001" });
        const [unpublished] = await handler.wb.unpublishPage({ id: "any-page#0001" });

        expect(published.data.websiteBuilder.publishPage.data).toBeNull();
        expect(published.data.websiteBuilder.publishPage.error).toMatchObject({
            code: "WebsiteBuilder/Page/NotAuthorized",
            message: "Not authorized!"
        });
        expect(unpublished.data.websiteBuilder.unpublishPage.error.code).toBe(
            "WebsiteBuilder/Page/NotAuthorized"
        );
    });

    it("returns NotFound with its data for a missing page", async () => {
        const handler = useGraphQlHandler({});

        const [published] = await handler.wb.publishPage({ id: "missing-page#0001" });

        expect(published.data.websiteBuilder.publishPage.error).toEqual({
            code: "WebsiteBuilder/Page/NotFound",
            message: "Page not found!",
            data: { id: "missing-page#0001" }
        });
    });

    it("keeps the code and data of a before-publish handler's rejection (A26)", async () => {
        const handler = useGraphQlHandler({ legacyPlugins: [blockPublish] });
        const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
        const page = created.data.websiteBuilder.createPage.data;

        const [published] = await handler.wb.publishPage({ id: page.id });

        expect(published.data.websiteBuilder.publishPage.error).toEqual({
            code: "Test/Page/PublishBlocked",
            message: "Publishing is blocked by a test rule.",
            data: { pageId: page.id }
        });
    });
});
