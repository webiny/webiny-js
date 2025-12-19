import { describe, it, expect, beforeEach } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";

describe("Redirects CRUD", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    it("should create a redirect", async () => {
        const [response] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });

        expect(response.data.wb.createRedirect.error).toBeNull();
        const redirect = response.data.wb.createRedirect.data;
        expect(redirect).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            version: 1,
            source: redirectMocks.redirectA.source,
            target: redirectMocks.redirectA.target,
            type: redirectMocks.redirectA.type,
            status: "draft",
            locked: false
        });
    });

    it("should update a redirect", async () => {
        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.wb.createRedirect.data;

        const updatedData = {
            source: "/old-page-a-updated",
            target: "/new-page-a-updated",
            type: 302
        };

        const [updateResponse] = await handler.wb.updateRedirect({
            id: redirect.id,
            data: updatedData
        });

        expect(updateResponse.data.wb.updateRedirect.error).toBeNull();
        expect(updateResponse.data.wb.updateRedirect.data).toMatchObject({
            id: redirect.id,
            source: updatedData.source,
            target: updatedData.target,
            type: updatedData.type
        });
    });

    it("should list redirects", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });
        await handler.wb.createRedirect({ data: redirectMocks.redirectB });
        await handler.wb.createRedirect({ data: redirectMocks.redirectC });

        const redirects = await handler.until(
            () => handler.wb.listRedirects({ where: {} }),
            ([response]) => response.data.wb.listRedirects.data.length === 3
        );

        expect(redirects[0].data.wb.listRedirects.error).toBeNull();
        expect(redirects[0].data.wb.listRedirects.data).toHaveLength(3);
        expect(redirects[0].data.wb.listRedirects.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should filter redirects by type", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });
        await handler.wb.createRedirect({ data: redirectMocks.redirectB });
        await handler.wb.createRedirect({ data: redirectMocks.redirectC });

        const redirects = await handler.until(
            () => handler.wb.listRedirects({ where: { type: 301 } }),
            ([response]) => response.data.wb.listRedirects.data.length === 2
        );

        expect(redirects[0].data.wb.listRedirects.error).toBeNull();
        expect(redirects[0].data.wb.listRedirects.data).toHaveLength(2);
        expect(redirects[0].data.wb.listRedirects.data.every((r: any) => r.type === 301)).toBe(
            true
        );
    });

    it("should delete a redirect", async () => {
        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.wb.createRedirect.data;

        const [deleteResponse] = await handler.wb.deleteRedirect({ id: redirect.id });

        expect(deleteResponse.data.wb.deleteRedirect.error).toBeNull();
        expect(deleteResponse.data.wb.deleteRedirect.data).toBe(true);

        // Wait for deletion to be indexed
        const redirectsList = await handler.until(
            () => handler.wb.listRedirects({ where: {} }),
            ([response]) => response.data.wb.listRedirects.data.length === 0
        );

        expect(redirectsList[0].data.wb.listRedirects.data).toHaveLength(0);
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
        const [createResponse] = await anonymousHandler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        expect(createResponse.data.wb.createRedirect).toEqual(notAuthorizedResponse);

        // Create a redirect with authenticated user
        const [authCreateResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = authCreateResponse.data.wb.createRedirect.data;
        expect(redirect).toBeDefined();

        // Try to list with anonymous identity
        const [listResponse] = await anonymousHandler.wb.listRedirects({ where: {} });
        expect(listResponse.data.wb.listRedirects).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to update with anonymous identity
        const [updateResponse] = await anonymousHandler.wb.updateRedirect({
            id: redirect.id,
            data: { source: "/updated" }
        });
        expect(updateResponse.data.wb.updateRedirect).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to delete with anonymous identity
        const [deleteResponse] = await anonymousHandler.wb.deleteRedirect({ id: redirect.id });
        expect(deleteResponse.data.wb.deleteRedirect).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );
    });

    it("should not allow duplicate source paths", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });

        const [duplicateResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });

        expect(duplicateResponse.data.wb.createRedirect.data).toBeNull();
        expect(duplicateResponse.data.wb.createRedirect.error).not.toBeNull();
        expect(duplicateResponse.data.wb.createRedirect.error.code).toContain("ValidationError");
    });

    it("should validate redirect type", async () => {
        const [response] = await handler.wb.createRedirect({
            data: {
                source: "/test",
                target: "/test-target",
                type: 999 // Invalid type
            }
        });

        expect(response.data.wb.createRedirect.data).toBeNull();
        expect(response.data.wb.createRedirect.error).not.toBeNull();
    });

    it("should validate source and target paths", async () => {
        const [response] = await handler.wb.createRedirect({
            data: {
                source: "", // Empty source
                target: "/test-target",
                type: 301
            }
        });

        expect(response.data.wb.createRedirect.data).toBeNull();
        expect(response.data.wb.createRedirect.error).not.toBeNull();
        expect(response.data.wb.createRedirect.error.code).toContain("ValidationError");
    });
});
