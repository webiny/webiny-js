import { describe, it, expect, beforeEach } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks, userMock } from "./mocks/page.mock.js";

describe("Pages CRUD", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    it("should create a page", async () => {
        const [response] = await handler.wb.createPage({
            data: pageMocks.pageA
        });

        expect(response.data.wb.createPage.error).toBeNull();
        const page = response.data.wb.createPage.data;
        expect(page).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            title: pageMocks.pageA.properties.title,
            path: pageMocks.pageA.properties.path,
            status: "draft",
            locked: false,
            properties: pageMocks.pageA.properties,
            bindings: pageMocks.pageA.bindings,
            elements: pageMocks.pageA.elements
        });
    });

    it("should update a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

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

        expect(updateResponse.data.wb.updatePage.error).toBeNull();
        expect(updateResponse.data.wb.updatePage.data).toMatchObject({
            id: page.id,
            title: updatedData.properties.title,
            path: updatedData.properties.path,
            properties: updatedData.properties
        });
    });

    it("should get page by id", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        const fetchedPage = await handler.until(
            () => handler.wb.getPageById({ id: page.id }),
            ([response]) => response.data.wb.getPageById.data !== null
        );

        expect(fetchedPage[0].data.wb.getPageById.error).toBeNull();
        expect(fetchedPage[0].data.wb.getPageById.data).toMatchObject({
            id: page.id,
            entryId: page.entryId,
            version: page.version,
            title: page.title,
            path: page.path
        });
    });

    it("should get page by path", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        // Publish the page first so it's accessible by path
        await handler.wb.publishPage({ id: page.id });

        const [getResponse] = await handler.wb.getPageByPath({
            path: pageMocks.pageA.properties.path
        });

        expect(getResponse.data.wb.getPageByPath.error).toBeNull();
        expect(getResponse.data.wb.getPageByPath.data).toMatchObject({
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
            ([response]) => response.data.wb.listPages.data.length === 3
        );

        expect(pages[0].data.wb.listPages.error).toBeNull();
        expect(pages[0].data.wb.listPages.data).toHaveLength(3);
        expect(pages[0].data.wb.listPages.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should publish a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        const [publishResponse] = await handler.wb.publishPage({ id: page.id });

        expect(publishResponse.data.wb.publishPage.error).toBeNull();
        expect(publishResponse.data.wb.publishPage.data).toMatchObject({
            id: page.id,
            status: "published",
            locked: true
        });
    });

    it("should unpublish a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        await handler.wb.publishPage({ id: page.id });
        const [unpublishResponse] = await handler.wb.unpublishPage({ id: page.id });

        expect(unpublishResponse.data.wb.unpublishPage.error).toBeNull();
        expect(unpublishResponse.data.wb.unpublishPage.data).toMatchObject({
            id: page.id,
            status: "unpublished"
        });
    });

    it("should duplicate a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        const [duplicateResponse] = await handler.wb.duplicatePage({ id: page.id });

        expect(duplicateResponse.data.wb.duplicatePage.error).toBeNull();
        const duplicatedPage = duplicateResponse.data.wb.duplicatePage.data;
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

    it("should create page revision from existing page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        await handler.wb.publishPage({ id: page.id });

        const [revisionResponse] = await handler.wb.createPageRevisionFrom({ id: page.id });

        expect(revisionResponse.data.wb.createPageRevisionFrom.error).toBeNull();
        const newRevision = revisionResponse.data.wb.createPageRevisionFrom.data;
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
        const page = createResponse.data.wb.createPage.data;

        await handler.wb.publishPage({ id: page.id });
        await handler.wb.createPageRevisionFrom({ id: page.id });

        const revisions = await handler.until(
            () => handler.wb.getPageRevisions({ entryId: page.entryId }),
            ([response]) => response.data.wb.getPageRevisions.data.length === 2
        );

        expect(revisions[0].data.wb.getPageRevisions.error).toBeNull();
        expect(revisions[0].data.wb.getPageRevisions.data).toHaveLength(2);
        expect(revisions[0].data.wb.getPageRevisions.data[0].version).toBe(1);
        expect(revisions[0].data.wb.getPageRevisions.data[1].version).toBe(2);
    });

    it("should delete a page", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.wb.createPage.data;

        const [deleteResponse] = await handler.wb.deletePage({ id: page.id });

        expect(deleteResponse.data.wb.deletePage.error).toBeNull();
        expect(deleteResponse.data.wb.deletePage.data).toBe(true);

        // Wait for deletion to be indexed
        await handler.until(
            () => handler.wb.getPageById({ id: page.id }),
            ([response]) => response.data.wb.getPageById.data === null,
            { tries: 10 }
        );

        const [getResponse] = await handler.wb.getPageById({ id: page.id });
        expect(getResponse.data.wb.getPageById.data).toBeNull();
        expect(getResponse.data.wb.getPageById.error).not.toBeNull();
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
        expect(createResponse.data.wb.createPage).toEqual(notAuthorizedResponse);

        // Create a page with authenticated user
        const [authCreateResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = authCreateResponse.data.wb.createPage.data;
        expect(page).toBeDefined();

        // Try to read with anonymous identity
        const [getResponse] = await anonymousHandler.wb.getPageById({ id: page.id });
        expect(getResponse.data.wb.getPageById).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to update with anonymous identity
        const [updateResponse] = await anonymousHandler.wb.updatePage({
            id: page.id,
            data: { properties: { title: "Updated" } }
        });
        expect(updateResponse.data.wb.updatePage).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to delete with anonymous identity
        const [deleteResponse] = await anonymousHandler.wb.deletePage({ id: page.id });
        expect(deleteResponse.data.wb.deletePage).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );
    });

    it("should get and update settings", async () => {
        const [getResponse] = await handler.wb.getSettings({});
        expect(getResponse.data.wb.getSettings.error).toBeNull();
        expect(getResponse.data.wb.getSettings.data).toMatchObject({
            previewDomain: expect.any(String)
        });

        const [updateResponse] = await handler.wb.updateSettings({
            data: {
                previewDomain: "http://localhost:4000"
            }
        });
        expect(updateResponse.data.wb.updateSettings.error).toBeNull();
        expect(updateResponse.data.wb.updateSettings.data).toBe(true);

        const [getUpdatedResponse] = await handler.wb.getSettings({});
        expect(getUpdatedResponse.data.wb.getSettings.data.previewDomain).toBe(
            "http://localhost:4000"
        );
    });

    it("should get and update integrations", async () => {
        const [getResponse] = await handler.wb.getIntegrations({});
        expect(getResponse.data.wb.getIntegrations.error).toBeNull();

        const integrationData = {
            googleAnalytics: {
                trackingId: "UA-123456-1"
            }
        };

        const [updateResponse] = await handler.wb.updateIntegrations({
            data: integrationData
        });
        expect(updateResponse.data.wb.updateIntegrations.error).toBeNull();
        expect(updateResponse.data.wb.updateIntegrations.data).toBe(true);

        const [getUpdatedResponse] = await handler.wb.getIntegrations({});
        expect(getUpdatedResponse.data.wb.getIntegrations.data).toMatchObject(integrationData);
    });
});
