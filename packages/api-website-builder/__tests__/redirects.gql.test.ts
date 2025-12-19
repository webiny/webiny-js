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

        expect(response.data.websiteBuilder.createRedirect.error).toBeNull();
        const redirect = response.data.websiteBuilder.createRedirect.data;
        expect(redirect).toMatchObject({
            id: expect.any(String),
            redirectFrom: redirectMocks.redirectA.redirectFrom,
            redirectTo: redirectMocks.redirectA.redirectTo,
            redirectType: redirectMocks.redirectA.redirectType
        });
    });

    it("should update a redirect", async () => {
        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.websiteBuilder.createRedirect.data;

        const updatedData = {
            redirectFrom: "/old-page-a-updated",
            redirectTo: "/new-page-a-updated",
            redirectType: "temporary",
            isEnabled: true
        };

        const [updateResponse] = await handler.wb.updateRedirect({
            id: redirect.id,
            data: updatedData
        });

        expect(updateResponse.data.websiteBuilder.updateRedirect.error).toBeNull();
        expect(updateResponse.data.websiteBuilder.updateRedirect.data).toMatchObject({
            id: redirect.id,
            redirectFrom: updatedData.redirectFrom,
            redirectTo: updatedData.redirectTo,
            redirectType: updatedData.redirectType
        });
    });

    it("should list redirects", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });
        await handler.wb.createRedirect({ data: redirectMocks.redirectB });
        await handler.wb.createRedirect({ data: redirectMocks.redirectC });

        const redirects = await handler.until(
            () => handler.wb.listRedirects({ where: {} }),
            ([response]) => response.data.websiteBuilder.listRedirects.data.length === 3
        );

        expect(redirects[0].data.websiteBuilder.listRedirects.error).toBeNull();
        expect(redirects[0].data.websiteBuilder.listRedirects.data).toHaveLength(3);
        expect(redirects[0].data.websiteBuilder.listRedirects.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should filter redirects by redirectType", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });
        await handler.wb.createRedirect({ data: redirectMocks.redirectB });
        await handler.wb.createRedirect({ data: redirectMocks.redirectC });

        const redirects = await handler.until(
            () => handler.wb.listRedirects({ where: { redirectType: "permanent" } }),
            ([response]) => response.data.websiteBuilder.listRedirects.data.length === 2
        );

        expect(redirects[0].data.websiteBuilder.listRedirects.error).toBeNull();
        expect(redirects[0].data.websiteBuilder.listRedirects.data).toHaveLength(2);
        expect(
            redirects[0].data.websiteBuilder.listRedirects.data.every(
                (r: any) => r.redirectType === "permanent"
            )
        ).toBe(true);
    });

    it("should delete a redirect", async () => {
        const [createResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = createResponse.data.websiteBuilder.createRedirect.data;

        const [deleteResponse] = await handler.wb.deleteRedirect({ id: redirect.id });

        expect(deleteResponse.data.websiteBuilder.deleteRedirect.error).toBeNull();
        expect(deleteResponse.data.websiteBuilder.deleteRedirect.data).toBe(true);

        // Wait for deletion to be indexed
        const redirectsList = await handler.until(
            () => handler.wb.listRedirects({ where: {} }),
            ([response]) => response.data.websiteBuilder.listRedirects.data.length === 0
        );

        expect(redirectsList[0].data.websiteBuilder.listRedirects.data).toHaveLength(0);
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
        expect(createResponse.data.websiteBuilder.createRedirect).toEqual(notAuthorizedResponse);

        // Create a redirect with authenticated user
        const [authCreateResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });
        const redirect = authCreateResponse.data.websiteBuilder.createRedirect.data;
        expect(redirect).toBeDefined();

        // Try to list with anonymous identity
        const [listResponse] = await anonymousHandler.wb.listRedirects({ where: {} });
        expect(listResponse.data.websiteBuilder.listRedirects).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to update with anonymous identity
        const [updateResponse] = await anonymousHandler.wb.updateRedirect({
            id: redirect.id,
            data: { ...redirectMocks.redirectA, redirectFrom: "/updated" }
        });
        expect(updateResponse.data.websiteBuilder.updateRedirect).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );

        // Try to delete with anonymous identity
        const [deleteResponse] = await anonymousHandler.wb.deleteRedirect({ id: redirect.id });
        expect(deleteResponse.data.websiteBuilder.deleteRedirect).toEqual(
            expect.objectContaining(notAuthorizedResponse)
        );
    });

    it.skip("should not allow duplicate redirectFrom paths", async () => {
        await handler.wb.createRedirect({ data: redirectMocks.redirectA });

        const [duplicateResponse] = await handler.wb.createRedirect({
            data: redirectMocks.redirectA
        });

        expect(duplicateResponse.data.websiteBuilder.createRedirect.data).toBeNull();
        expect(duplicateResponse.data.websiteBuilder.createRedirect.error).not.toBeNull();
        expect(duplicateResponse.data.websiteBuilder.createRedirect.error.code).toContain(
            "ValidationError"
        );
    });

    it.skip("should validate redirect redirectType", async () => {
        const [response] = await handler.wb.createRedirect({
            data: {
                redirectFrom: "/test",
                redirectTo: "/test-redirectTo",
                redirectType: 999 // Invalid redirectType
            }
        });

        expect(response.data.websiteBuilder.createRedirect.data).toBeNull();
        expect(response.data.websiteBuilder.createRedirect.error).not.toBeNull();
    });

    it.skip("should validate redirectFrom and redirectTo paths", async () => {
        const [response] = await handler.wb.createRedirect({
            data: {
                redirectFrom: "", // Empty redirectFrom
                redirectTo: "/test-redirectTo",
                redirectType: 301
            }
        });

        expect(response.data.websiteBuilder.createRedirect.data).toBeNull();
        expect(response.data.websiteBuilder.createRedirect.error).not.toBeNull();
        expect(response.data.websiteBuilder.createRedirect.error.code).toContain("ValidationError");
    });
});
