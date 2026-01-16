import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "~/features/pages/UnpublishPage/index.js";
import { DuplicatePageUseCase } from "~/features/pages/DuplicatePage/index.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";
import { DeletePageUseCase } from "~/features/pages/DeletePage/index.js";

describe("Pages Use Cases (Unauthorized)", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const handler = useHandler({ permissions: [] });
        context = await handler.handler();
    });

    it("should not be able to create a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const result = await createPage.execute(pageMocks.pageA);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to update a page", async () => {
        const updatePage = context.container.resolve(UpdatePageUseCase);
        const result = await updatePage.execute("some-id", {
            properties: {
                title: "Updated Title",
                path: "/updated-path"
            }
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to get page by id", async () => {
        const getPageById = context.container.resolve(GetPageByIdUseCase);
        const result = await getPageById.execute("some-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to get page by path", async () => {
        const getPageByPath = context.container.resolve(GetPageByPathUseCase);
        const result = await getPageByPath.execute("/some-path");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to list pages", async () => {
        const listPages = context.container.resolve(ListPagesUseCase);
        const result = await listPages.execute({
            where: {},
            limit: 100,
            after: null,
            sort: []
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to publish a page", async () => {
        const publishPage = context.container.resolve(PublishPageUseCase);
        const result = await publishPage.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to unpublish a page", async () => {
        const unpublishPage = context.container.resolve(UnpublishPageUseCase);
        const result = await unpublishPage.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to duplicate a page", async () => {
        const duplicatePage = context.container.resolve(DuplicatePageUseCase);
        const result = await duplicatePage.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to create revision from existing page", async () => {
        const createRevision = context.container.resolve(CreatePageRevisionFromUseCase);
        const result = await createRevision.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to get page revisions", async () => {
        const getRevisions = context.container.resolve(GetPageRevisionsUseCase);
        const result = await getRevisions.execute("some-entry-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("should not be able to delete a page", async () => {
        const deletePage = context.container.resolve(DeletePageUseCase);
        const result = await deletePage.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });
});
