import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

describe("Pages CRUD", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    it("should create a page", async () => {
        const [response] = await handler.wb.createPage({
            data: pageMocks.pageA
        });

        expect(response.data.websiteBuilder.createPage.error).toBeNull();
        const page = response.data.websiteBuilder.createPage.data;
        expect(page).toMatchObject({
            id: expect.any(String),
            version: 1,
            status: "draft",
            ...pageMocks.pageA
        });
    });

    it("should update a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const updatedData = {
            properties: {
                title: "Page A Updated",
                path: "/page-a-updated"
            }
        };

        const [updateResponse] = await handler.wb.updatePage({
            id: page.id,
            data: updatedData
        });

        expect(updateResponse.data.websiteBuilder.updatePage.error).toBeNull();
        expect(updateResponse.data.websiteBuilder.updatePage.data).toMatchObject({
            id: page.id,
            ...updatedData
        });
    });

    it("should get page by id", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const fetchedPage = await handler.until(
            () => handler.wb.getPageById({ id: page.id }),
            ([response]) => response.data.websiteBuilder.getPageById.data !== null
        );

        expect(fetchedPage[0].data.websiteBuilder.getPageById.error).toBeNull();
        expect(fetchedPage[0].data.websiteBuilder.getPageById.data).toMatchObject(page);
    });

    it("should get page by path", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        // Publish the page first so it's accessible by path
        await handler.wb.publishPage({ id: page.id });

        const [getResponse] = await handler.wb.getPageByPath({
            path: pageMocks.pageA.properties.path
        });

        expect(getResponse.data.websiteBuilder.getPageByPath.error).toBeNull();
        expect(getResponse.data.websiteBuilder.getPageByPath.data).toMatchObject({
            id: expect.any(String),
            properties: expect.objectContaining({
                title: pageMocks.pageA.properties.title
            })
        });
    });

    it("should list pages", async () => {
        await handler.wb.createPage({ data: pageMocks.pageA });
        await handler.wb.createPage({ data: pageMocks.pageB });
        await handler.wb.createPage({ data: pageMocks.pageC });

        const pages = await handler.until(
            () => handler.wb.listPages({ where: {} }),
            ([response]) => response.data.websiteBuilder.listPages.data.length === 3
        );

        expect(pages[0].data.websiteBuilder.listPages.error).toBeNull();
        expect(pages[0].data.websiteBuilder.listPages.data).toHaveLength(3);
        expect(pages[0].data.websiteBuilder.listPages.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should publish a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const [publishResponse] = await handler.wb.publishPage({ id: page.id });

        expect(publishResponse.data.websiteBuilder.publishPage.error).toBeNull();
        expect(publishResponse.data.websiteBuilder.publishPage.data).toMatchObject({
            id: page.id,
            status: "published",
            locked: true
        });
    });

    it("should unpublish a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        await handler.wb.publishPage({ id: page.id });
        const [unpublishResponse] = await handler.wb.unpublishPage({ id: page.id });

        expect(unpublishResponse.data.websiteBuilder.unpublishPage.error).toBeNull();
        expect(unpublishResponse.data.websiteBuilder.unpublishPage.data).toMatchObject({
            id: page.id,
            status: "unpublished"
        });
    });

    it("should duplicate a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const [duplicateResponse] = await handler.wb.duplicatePage({ id: page.id });

        expect(duplicateResponse.data.websiteBuilder.duplicatePage.error).toBeNull();
        const duplicatedPage = duplicateResponse.data.websiteBuilder.duplicatePage.data;
        expect(duplicatedPage).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            status: "draft",
            locked: false,
            properties: {
                title: `Copy of ${page.properties.title}`
            }
        });
        expect(duplicatedPage.id).not.toBe(page.id);
        expect(duplicatedPage.entryId).not.toBe(page.entryId);
    });

    it("should create page revision from existing page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        await handler.wb.publishPage({ id: page.id });

        const [revisionResponse] = await handler.wb.createPageRevisionFrom({ id: page.id });

        expect(revisionResponse.data.websiteBuilder.createPageRevisionFrom.error).toBeNull();
        const newRevision = revisionResponse.data.websiteBuilder.createPageRevisionFrom.data;
        expect(newRevision).toMatchObject({
            entryId: page.entryId,
            version: 2,
            status: "draft",
            locked: false
        });
    });

    it("should get page revisions", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        await handler.wb.publishPage({ id: page.id });
        await handler.wb.createPageRevisionFrom({ id: page.id });

        const revisions = await handler.until(
            () => handler.wb.getPageRevisions({ entryId: page.entryId }),
            ([response]) => response.data.websiteBuilder.getPageRevisions.data.length === 2
        );

        expect(revisions[0].data.websiteBuilder.getPageRevisions.error).toBeNull();
        expect(revisions[0].data.websiteBuilder.getPageRevisions.data).toHaveLength(2);
        expect(revisions[0].data.websiteBuilder.getPageRevisions.data[0].version).toBe(1);
        expect(revisions[0].data.websiteBuilder.getPageRevisions.data[1].version).toBe(2);
    });

    it("should delete a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const [trashResponse] = await handler.wb.trashPage({ id: page.id });

        expect(trashResponse.data.websiteBuilder.trashPage.error).toBeNull();
        expect(trashResponse.data.websiteBuilder.trashPage.data).toBe(true);

        const [getAfterTrashResponse] = await handler.wb.getPageById({ id: page.id });
        expect(getAfterTrashResponse.data.websiteBuilder.getPageById.data).toBeNull();
        expect(getAfterTrashResponse.data.websiteBuilder.getPageById.error).not.toBeNull();

        const [listTrashedResponse] = await handler.wb.listTrashedPages();
        expect(listTrashedResponse.data.websiteBuilder.listTrashedPages.error).toBeNull();
        expect(listTrashedResponse.data.websiteBuilder.listTrashedPages.data).toHaveLength(1);
        expect(listTrashedResponse.data.websiteBuilder.listTrashedPages.data[0].id).toBe(page.id);

        const [restorePage] = await handler.wb.restorePage({ id: page.id });

        expect(restorePage.data.websiteBuilder.restorePage.error).toBeNull();
        expect(restorePage.data.websiteBuilder.restorePage.data).toMatchObject({
            id: page.id
        });

        const [getAfterRestoreResponse] = await handler.wb.getPageById({ id: page.id });
        expect(getAfterRestoreResponse.data.websiteBuilder.getPageById.error).toBeNull();
        expect(getAfterRestoreResponse.data.websiteBuilder.getPageById.data).toMatchObject(page);

        // should not be possible to delete because the page is not trashed
        const [tryToDeleteResponse] = await handler.wb.deletePage({ id: page.id });

        expect(tryToDeleteResponse.data.websiteBuilder.deletePage.error).not.toBeNull();
        expect(tryToDeleteResponse.data.websiteBuilder.deletePage.data).toBeNull();

        // trash page again
        const [trashPageAgainResponse] = await handler.wb.trashPage({ id: page.id });
        expect(trashPageAgainResponse.data.websiteBuilder.trashPage.error).toBeNull();
        expect(trashPageAgainResponse.data.websiteBuilder.trashPage.data).toEqual(true);

        const [deleteResponse] = await handler.wb.deletePage({ id: page.id });

        expect(deleteResponse.data.websiteBuilder.deletePage.error).toBeNull();
        expect(deleteResponse.data.websiteBuilder.deletePage.data).toBe(true);

        // Wait for deletion to be indexed
        await handler.until(
            () => handler.wb.getPageById({ id: page.id }),
            ([response]) => response.data.websiteBuilder.getPageById.data === null,
            { tries: 10 }
        );

        const [getResponse] = await handler.wb.getPageById({ id: page.id });
        expect(getResponse.data.websiteBuilder.getPageById.data).toBeNull();
        expect(getResponse.data.websiteBuilder.getPageById.error).not.toBeNull();
    });

    it("should enforce security rules", async () => {
        const anonymousHandler = useGraphQlHandler({ identity: null });

        const notAuthorizedResponse = {
            data: null,
            error: {
                code: "NOT_AUTHORIZED",
                message: "Not authorized!",
                data: null
            }
        };

        // Create with anonymous identity
        const [createResponse] = await anonymousHandler.wb.createPage({
            data: pageMocks.pageA
        });
        expect(createResponse.data.websiteBuilder.createPage).toEqual(notAuthorizedResponse);

        // Create a page with authenticated user
        const [authCreateResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = authCreateResponse.data.websiteBuilder.createPage.data;
        expect(page).toBeDefined();

        // Try to read with anonymous identity
        const [getResponse] = await anonymousHandler.wb.getPageById({ id: page.id });
        expect(getResponse.data.websiteBuilder.getPageById).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to update with anonymous identity
        const [updateResponse] = await anonymousHandler.wb.updatePage({
            id: page.id,
            data: { properties: { title: "Updated" } }
        });
        expect(updateResponse.data.websiteBuilder.updatePage).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to delete with anonymous identity
        const [deleteResponse] = await anonymousHandler.wb.deletePage({ id: page.id });
        expect(deleteResponse.data.websiteBuilder.deletePage).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );
    });

    it("should get and update settings", async () => {
        const [getResponse] = await handler.wb.getSettings({});
        expect(getResponse.data.websiteBuilder.getSettings.error).toBeNull();
        expect(getResponse.data.websiteBuilder.getSettings.data).toMatchObject({
            previewDomain: expect.any(String)
        });

        const [updateResponse] = await handler.wb.updateSettings({
            data: {
                previewDomain: "http://localhost:4000"
            }
        });
        expect(updateResponse.data.websiteBuilder.updateSettings.error).toBeNull();
        expect(updateResponse.data.websiteBuilder.updateSettings.data).toBe(true);

        const [getUpdatedResponse] = await handler.wb.getSettings({});
        expect(getUpdatedResponse.data.websiteBuilder.getSettings.data.previewDomain).toBe(
            "http://localhost:4000"
        );
    });

    it("should get and update integrations", async () => {
        const [getResponse] = await handler.wb.getIntegrations({});
        expect(getResponse.data.websiteBuilder.getIntegrations.error).toBeNull();

        const integrationData = {
            googleAnalytics: {
                trackingId: "UA-123456-1"
            }
        };

        const [updateResponse] = await handler.wb.updateIntegrations({
            data: integrationData
        });
        expect(updateResponse.data.websiteBuilder.updateIntegrations.error).toBeNull();
        expect(updateResponse.data.websiteBuilder.updateIntegrations.data).toBe(true);

        const [getUpdatedResponse] = await handler.wb.getIntegrations({});
        expect(getUpdatedResponse.data.websiteBuilder.getIntegrations.data).toMatchObject(
            integrationData
        );
    });

    it("should update page revision description", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const revisionDescription = "Updated revision description";

        const [updateResponse] = await handler.wb.updatePageRevisionDescription({
            id: page.id,
            revisionDescription
        });

        expect(updateResponse.data.websiteBuilder.updatePageRevisionDescription.error).toBeNull();
        expect(updateResponse.data.websiteBuilder.updatePageRevisionDescription.data).toMatchObject(
            {
                id: page.id,
                revisionDescription
            }
        );

        const [updatedPageResponse] = await handler.wb.getPageById({ id: page.id });
        expect(updatedPageResponse.data.websiteBuilder.getPageById.error).toBeNull();
        expect(updatedPageResponse.data.websiteBuilder.getPageById.data).toMatchObject({
            id: page.id,
            revisionDescription
        });

        const [revisionsResponse] = await handler.wb.getPageRevisions({ entryId: page.entryId });

        expect(revisionsResponse.data.websiteBuilder.getPageRevisions.error).toBeNull();
        const revisions = revisionsResponse.data.websiteBuilder.getPageRevisions.data;
        expect(revisions).toHaveLength(1);
        expect(revisions[0]).toMatchObject({
            id: page.id,
            revisionDescription
        });
    });
});
