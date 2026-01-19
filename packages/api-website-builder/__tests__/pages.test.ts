import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { until } from "@webiny/project-utils/testing/helpers/until";
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

describe("Pages Use Cases (Authorized)", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const handler = useHandler({});
        context = await handler.handler();
    });

    it("should create a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const result = await createPage.execute(pageMocks.pageA);

        if (result.isFail()) {
            throw result.error;
        }

        const page = result.value;

        expect(page).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            status: "draft",
            locked: false,
            ...pageMocks.pageA
        });
    });

    it("should update a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const updatedData = {
            properties: {
                title: "Updated Title",
                path: "/updated-path"
            }
        };

        const updatePage = context.container.resolve(UpdatePageUseCase);
        const updateResult = await updatePage.execute(page.id, updatedData);

        if (updateResult.isFail()) {
            throw updateResult.error;
        }

        const updatedPage = updateResult.value;

        expect(updatedPage).toMatchObject({
            id: page.id,
            ...updatedData
        });
    });

    it("should get page by id", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const getPageById = context.container.resolve(GetPageByIdUseCase);

        const fetchedPage = await until(
            async () => {
                const result = await getPageById.execute(page.id);
                return result.isOk() ? result.value : null;
            },
            (result: any) => result !== null
        );

        expect(fetchedPage).toMatchObject(page);
    });

    it("should get page by path", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const publishPage = context.container.resolve(PublishPageUseCase);
        const publishResult = await publishPage.execute({ id: page.id });

        if (publishResult.isFail()) {
            throw publishResult.error;
        }

        const getPageByPath = context.container.resolve(GetPageByPathUseCase);
        const getResult = await getPageByPath.execute(pageMocks.pageA.properties.path);

        if (getResult.isFail()) {
            throw getResult.error;
        }

        const fetchedPage = getResult.value;

        expect(fetchedPage).toBeDefined();
        expect(fetchedPage.properties.title).toBe(pageMocks.pageA.properties.title);
    });

    it("should list pages", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        await createPage.execute(pageMocks.pageA);
        await createPage.execute(pageMocks.pageB);
        await createPage.execute(pageMocks.pageC);

        const listPages = context.container.resolve(ListPagesUseCase);

        const result = await until(
            async () => {
                const listResult = await listPages.execute({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                });
                return listResult.isOk() ? listResult.value : { pages: [], meta: {} };
            },
            (result: any) => result.pages.length === 3
        );

        const { pages, meta } = result;

        expect(pages).toHaveLength(3);
        expect(meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should publish a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const publishPage = context.container.resolve(PublishPageUseCase);
        const publishResult = await publishPage.execute({ id: page.id });

        if (publishResult.isFail()) {
            throw publishResult.error;
        }

        const publishedPage = publishResult.value;

        expect(publishedPage).toMatchObject({
            id: page.id,
            status: "published",
            locked: true
        });
    });

    it("should unpublish a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const publishPage = context.container.resolve(PublishPageUseCase);
        await publishPage.execute({ id: page.id });

        const unpublishPage = context.container.resolve(UnpublishPageUseCase);
        const unpublishResult = await unpublishPage.execute({ id: page.id });

        if (unpublishResult.isFail()) {
            throw unpublishResult.error;
        }

        const unpublishedPage = unpublishResult.value;

        expect(unpublishedPage).toMatchObject({
            id: page.id,
            status: "unpublished"
        });
    });

    it("should duplicate a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const duplicatePage = context.container.resolve(DuplicatePageUseCase);
        const duplicateResult = await duplicatePage.execute({ id: page.id });

        if (duplicateResult.isFail()) {
            throw duplicateResult.error;
        }

        const duplicatedPage = duplicateResult.value;

        expect(duplicatedPage).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            status: "draft",
            locked: false
        });
        expect(duplicatedPage.id).not.toBe(page.id);
        expect(duplicatedPage.entryId).not.toBe(page.entryId);
    });

    it("should create revision from existing page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const publishPage = context.container.resolve(PublishPageUseCase);
        await publishPage.execute({ id: page.id });

        const createRevision = context.container.resolve(CreatePageRevisionFromUseCase);
        const revisionResult = await createRevision.execute({ id: page.id });

        if (revisionResult.isFail()) {
            throw revisionResult.error;
        }

        const newRevision = revisionResult.value;

        expect(newRevision).toMatchObject({
            entryId: page.entryId,
            version: 2,
            status: "draft",
            locked: false
        });
    });

    it("should get page revisions", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const publishPage = context.container.resolve(PublishPageUseCase);
        await publishPage.execute({ id: page.id });

        const createRevision = context.container.resolve(CreatePageRevisionFromUseCase);
        await createRevision.execute({ id: page.id });

        const getRevisions = context.container.resolve(GetPageRevisionsUseCase);

        const revisions = await until(
            async () => {
                const result = await getRevisions.execute(page.entryId);
                return result.isOk() ? result.value : [];
            },
            (result: any) => result.length === 2
        );

        expect(revisions).toHaveLength(2);
        expect(revisions[0].version).toBe(1);
        expect(revisions[1].version).toBe(2);
    });

    it("should delete a page", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const page = createResult.value;

        const deletePage = context.container.resolve(DeletePageUseCase);
        await deletePage.execute({ id: page.id });

        // Wait for deletion to be indexed
        const getPageById = context.container.resolve(GetPageByIdUseCase);

        const fetchedPage = await until(
            async () => {
                const result = await getPageById.execute(page.id);
                return result.isFail() ? null : result.value;
            },
            (result: any) => result === null,
            { tries: 10 }
        );

        expect(fetchedPage).toBeNull();
    });
});
