import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import type { WebsiteBuilderContext } from "~/context/types.js";
import { until } from "@webiny/project-utils/testing/helpers/until";

describe("Pages Context Methods", () => {
    let context: WebsiteBuilderContext;

    beforeEach(async () => {
        const handler = useHandler({});
        context = await handler.handler();
    });

    it("should create a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        expect(page).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            status: "draft",
            locked: false,
            ...pageMocks.pageA
        });
    });

    it("should update a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        const updatedData = {
            properties: {
                title: "Updated Title",
                path: "/updated-path"
            }
        };

        const updatedPage = await context.websiteBuilder.pages.update(page.id, updatedData);

        expect(updatedPage).toMatchObject({
            id: page.id,
            ...updatedData
        });
    });

    it("should get page by id via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        const fetchedPage = await until(
            () => context.websiteBuilder.pages.getById(page.id),
            (result: any) => result !== null
        );

        expect(fetchedPage).toMatchObject(page);
    });

    it("should get page by path via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);
        await context.websiteBuilder.pages.publish({ id: page.id });

        const fetchedPage = await context.websiteBuilder.pages.getByPath(
            pageMocks.pageA.properties.path
        );

        expect(fetchedPage).toBeDefined();
        expect(fetchedPage?.properties.title).toBe(pageMocks.pageA.properties.title);
    });

    it("should list pages via context", async () => {
        await context.websiteBuilder.pages.create(pageMocks.pageA);
        await context.websiteBuilder.pages.create(pageMocks.pageB);
        await context.websiteBuilder.pages.create(pageMocks.pageC);

        const result = await until(
            () =>
                context.websiteBuilder.pages.list({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                }),
            ([pages]: any) => pages.length === 3
        );

        const [pages, meta] = result;

        expect(pages).toHaveLength(3);
        expect(meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should publish a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        const publishedPage = await context.websiteBuilder.pages.publish({ id: page.id });

        expect(publishedPage).toMatchObject({
            id: page.id,
            status: "published",
            locked: true
        });
    });

    it("should unpublish a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);
        await context.websiteBuilder.pages.publish({ id: page.id });

        const unpublishedPage = await context.websiteBuilder.pages.unpublish({ id: page.id });

        expect(unpublishedPage).toMatchObject({
            id: page.id,
            status: "unpublished"
        });
    });

    it("should duplicate a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        const duplicatedPage = await context.websiteBuilder.pages.duplicate({ id: page.id });

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

    it("should create revision from existing page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);
        await context.websiteBuilder.pages.publish({ id: page.id });

        const newRevision = await context.websiteBuilder.pages.createRevisionFrom({ id: page.id });

        expect(newRevision).toMatchObject({
            entryId: page.entryId,
            version: 2,
            status: "draft",
            locked: false
        });
    });

    it("should get page revisions via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);
        await context.websiteBuilder.pages.publish({ id: page.id });
        await context.websiteBuilder.pages.createRevisionFrom({ id: page.id });

        const revisions = await until(
            () => context.websiteBuilder.pages.getRevisions(page.entryId),
            (result: any) => result.length === 2
        );

        expect(revisions).toHaveLength(2);
        expect(revisions[0].version).toBe(1);
        expect(revisions[1].version).toBe(2);
    });

    it("should delete a page via context", async () => {
        const page = await context.websiteBuilder.pages.create(pageMocks.pageA);

        await context.websiteBuilder.pages.delete({ id: page.id });

        // Wait for deletion to be indexed
        const fetchedPage = await until(
            () => context.websiteBuilder.pages.getById(page.id).catch(() => null),
            (result: any) => result === null,
            { tries: 10 }
        );

        expect(fetchedPage).toBeNull();
    });
});
