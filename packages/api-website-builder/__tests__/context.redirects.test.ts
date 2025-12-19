import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import type { WebsiteBuilderContext } from "~/context/types.js";
import { until } from "@webiny/project-utils/testing/helpers/until";

describe("Redirects Context Methods", () => {
    let context: WebsiteBuilderContext;

    beforeEach(async () => {
        const handler = useHandler({});
        context = await handler.handler();
    });

    it("should create a redirect via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

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

    it("should update a redirect via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        const updatedData = {
            source: "/updated-source",
            target: "/updated-target",
            type: 302
        };

        const updatedRedirect = await context.websiteBuilder.redirects.update(
            redirect.id,
            updatedData
        );

        expect(updatedRedirect).toMatchObject({
            id: redirect.id,
            source: updatedData.source,
            target: updatedData.target,
            type: updatedData.type
        });
    });

    it("should get redirect by id via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        const fetchedRedirect = await until(
            () => context.websiteBuilder.redirects.getById(redirect.id),
            (result: any) => result !== null
        );

        expect(fetchedRedirect).toMatchObject({
            id: redirect.id,
            entryId: redirect.entryId,
            version: redirect.version,
            source: redirect.source,
            target: redirect.target,
            type: redirect.type
        });
    });

    it("should list redirects via context", async () => {
        await context.websiteBuilder.redirects.create(redirectMocks.redirectA);
        await context.websiteBuilder.redirects.create(redirectMocks.redirectB);
        await context.websiteBuilder.redirects.create(redirectMocks.redirectC);

        const result = await until(
            () => context.websiteBuilder.redirects.list({}),
            ([redirects]: any) => redirects.length === 3
        );

        const [redirects, meta] = result;

        expect(redirects).toHaveLength(3);
        expect(meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should delete a redirect via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        await context.websiteBuilder.redirects.delete({ id: redirect.id });

        // Wait for deletion to be indexed
        const fetchedRedirect = await until(
            () => context.websiteBuilder.redirects.getById(redirect.id),
            (result: any) => result === null,
            { tries: 10 }
        );

        expect(fetchedRedirect).toBeNull();
    });

    it("should get active redirects via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        // Note: getActiveRedirects returns published redirects
        // Since we just created a draft, it won't be in active redirects yet
        const activeRedirects = await context.websiteBuilder.redirects.getActiveRedirects();
        expect(activeRedirects).toEqual([]);
    });

    it("should trigger lifecycle hooks", async () => {
        const beforeCreateCalls: any[] = [];
        const afterCreateCalls: any[] = [];

        context.websiteBuilder.redirects.onRedirectBeforeCreate.subscribe(params => {
            beforeCreateCalls.push(params);
        });

        context.websiteBuilder.redirects.onRedirectAfterCreate.subscribe(params => {
            afterCreateCalls.push(params);
        });

        await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        expect(beforeCreateCalls).toHaveLength(1);
        expect(afterCreateCalls).toHaveLength(1);
        expect(beforeCreateCalls[0].redirect).toMatchObject({
            source: redirectMocks.redirectA.source,
            target: redirectMocks.redirectA.target
        });
        expect(afterCreateCalls[0].redirect).toMatchObject({
            id: expect.any(String),
            source: redirectMocks.redirectA.source
        });
    });

    it("should trigger update lifecycle hooks", async () => {
        const beforeUpdateCalls: any[] = [];
        const afterUpdateCalls: any[] = [];

        context.websiteBuilder.redirects.onRedirectBeforeUpdate.subscribe(params => {
            beforeUpdateCalls.push(params);
        });

        context.websiteBuilder.redirects.onRedirectAfterUpdate.subscribe(params => {
            afterUpdateCalls.push(params);
        });

        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        await context.websiteBuilder.redirects.update(redirect.id, {
            source: "/updated-source"
        });

        expect(beforeUpdateCalls).toHaveLength(1);
        expect(afterUpdateCalls).toHaveLength(1);
    });

    it("should trigger delete lifecycle hooks", async () => {
        const beforeDeleteCalls: any[] = [];
        const afterDeleteCalls: any[] = [];

        context.websiteBuilder.redirects.onRedirectBeforeDelete.subscribe(params => {
            beforeDeleteCalls.push(params);
        });

        context.websiteBuilder.redirects.onRedirectAfterDelete.subscribe(params => {
            afterDeleteCalls.push(params);
        });

        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        await context.websiteBuilder.redirects.delete({ id: redirect.id });

        expect(beforeDeleteCalls).toHaveLength(1);
        expect(afterDeleteCalls).toHaveLength(1);
    });
});
