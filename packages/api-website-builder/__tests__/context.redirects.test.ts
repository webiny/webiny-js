import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import type { WebsiteBuilderContext } from "~/context/types.js";
import { until } from "@webiny/project-utils/testing/helpers/until";
import type { CreateWbRedirectData } from "~/context/redirects/redirects.types.js";

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
            version: 1,
            status: "draft",
            ...redirectMocks.redirectA
        });
    });

    it("should update a redirect via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        const updatedData: CreateWbRedirectData = {
            redirectFrom: "/updated-redirectFrom",
            redirectTo: "/updated-redirectTo",
            isEnabled: false,
            redirectType: "permanent"
        };

        const updatedRedirect = await context.websiteBuilder.redirects.update(
            redirect.id,
            updatedData
        );

        expect(updatedRedirect).toMatchObject({
            id: redirect.id,
            ...updatedData
        });
    });

    it("should get redirect by id via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        const fetchedRedirect = await until(
            () => context.websiteBuilder.redirects.getById(redirect.id),
            (result: any) => result !== null
        );

        expect(fetchedRedirect).toMatchObject(redirect);
    });

    it("should list redirects via context", async () => {
        await context.websiteBuilder.redirects.create(redirectMocks.redirectA);
        await context.websiteBuilder.redirects.create(redirectMocks.redirectB);
        await context.websiteBuilder.redirects.create(redirectMocks.redirectC);

        const result = await until(
            () =>
                context.websiteBuilder.redirects.list({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                }),
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
            () => context.websiteBuilder.redirects.getById(redirect.id).catch(() => null),
            (result: any) => result === null,
            { tries: 10 }
        );

        expect(fetchedRedirect).toBeNull();
    });

    it("should get active redirects via context", async () => {
        const redirect = await context.websiteBuilder.redirects.create(redirectMocks.redirectA);

        const redirects = await until(
            () => context.websiteBuilder.redirects.getActiveRedirects(),
            (result: any) => result.length > 0
        );

        expect(redirects).toEqual([redirect]);
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
            redirectFrom: "/updated-redirectFrom"
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
