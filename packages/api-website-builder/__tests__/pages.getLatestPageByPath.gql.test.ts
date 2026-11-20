import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { useHandler } from "./utils/useHandler.js";
import { GetLatestPageByPathUseCase } from "~/features/pages/GetLatestPageByPath/index.js";

const path = pageMocks.pageA.properties.path;

describe("getLatestPageByPath", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    const createPage = async () => {
        const [response] = await handler.wb.createPage({ data: pageMocks.pageA });
        return response.data.websiteBuilder.createPage.data;
    };

    const getLatestPageByPath = async (pagePath: string) => {
        const [response] = await handler.wb.getLatestPageByPath({ path: pagePath });
        expect(response.errors).toBeUndefined();
        return response.data.websiteBuilder.getLatestPageByPath;
    };

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    it("returns a draft-only page", async () => {
        const page = await createPage();

        const result = await getLatestPageByPath(path);

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            id: page.id,
            entryId: page.entryId,
            status: "draft",
            version: 1,
            properties: expect.objectContaining({ path })
        });
    });

    it("returns an unpublished page", async () => {
        const page = await createPage();
        await handler.wb.publishPage({ id: page.id });
        await handler.wb.unpublishPage({ id: page.id });

        const result = await getLatestPageByPath(path);

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            id: page.id,
            status: "unpublished",
            version: 1
        });
    });

    it("returns a published page", async () => {
        const page = await createPage();
        await handler.wb.publishPage({ id: page.id });

        const result = await getLatestPageByPath(path);

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            id: page.id,
            status: "published",
            version: 1
        });
    });

    it("returns the newer draft when one follows a published revision", async () => {
        const page = await createPage();
        await handler.wb.publishPage({ id: page.id });
        const [revisionResponse] = await handler.wb.createPageRevisionFrom({ id: page.id });
        const revision = revisionResponse.data.websiteBuilder.createPageRevisionFrom.data;

        const result = await getLatestPageByPath(path);

        expect(revision.version).toBe(2);
        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            id: revision.id,
            entryId: page.entryId,
            status: "draft",
            version: 2
        });

        // `getPageByPath` keeps returning the published revision.
        const [publishedResponse] = await handler.wb.getPageByPath({ path });
        expect(publishedResponse.data.websiteBuilder.getPageByPath.data).toMatchObject({
            id: page.id,
            version: 1
        });
    });

    it("returns NotFound for a path with no page", async () => {
        await createPage();

        const result = await getLatestPageByPath("/missing-page");

        expect(result).toEqual({
            data: null,
            error: {
                code: "WebsiteBuilder/Page/NotFound",
                message: "Page not found!",
                data: { id: "/missing-page" }
            }
        });
    });

    it("returns NotFound for a trashed page", async () => {
        const page = await createPage();
        await handler.wb.publishPage({ id: page.id });
        const [trashResponse] = await handler.wb.trashPage({ id: page.id });
        expect(trashResponse.data.websiteBuilder.trashPage.error).toBeNull();

        const result = await getLatestPageByPath(path);

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({ code: "WebsiteBuilder/Page/NotFound" });
    });

    it("returns NotFound for a permanently deleted page", async () => {
        const page = await createPage();
        const [deleteResponse] = await handler.wb.deletePage({ id: page.id });
        expect(deleteResponse.data.websiteBuilder.deletePage.error).toBeNull();

        const result = await getLatestPageByPath(path);

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({ code: "WebsiteBuilder/Page/NotFound" });
    });
});

describe("getPageByPath with a draft-only page", () => {
    it("still returns not found", async () => {
        const handler = useGraphQlHandler({});
        await handler.wb.createPage({ data: pageMocks.pageA });

        const [response] = await handler.wb.getPageByPath({ path });

        expect(response.data.websiteBuilder.getPageByPath).toMatchObject({
            data: null,
            error: { code: "NOT_FOUND" }
        });
    });
});

describe("GetLatestPageByPathUseCase without permissions", () => {
    it("returns NotAuthorized", async () => {
        const handler = useHandler({ permissions: [] });
        const context = await handler.handler();
        const getLatestPageByPath = context.container.resolve(GetLatestPageByPathUseCase);

        const result = await getLatestPageByPath.execute(path);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });
});
