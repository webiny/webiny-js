import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "~/features/pages/UnpublishPage/index.js";
import { DeletePageUseCase } from "~/features/pages/DeletePage/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const NOT_AUTHORIZED = "WebsiteBuilder/Page/NotAuthorized";

const identityA: IdentityData = { id: "identity-a", type: "admin", displayName: "User A" };
const identityB: IdentityData = { id: "identity-b", type: "admin", displayName: "User B" };

/**
 * Helper: creates a page as identityA with full permissions.
 */
const createSeedPage = async () => {
    const handler = useHandler({ identity: identityA });
    const ctx = await handler.handler();
    const createPage = ctx.container.resolve(CreatePageUseCase);
    const result = await createPage.execute(pageMocks.pageA);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

/**
 * Helper: creates and publishes a page as identityA with full permissions.
 */
const createAndPublishSeedPage = async () => {
    const handler = useHandler({ identity: identityA });
    const ctx = await handler.handler();
    const createPage = ctx.container.resolve(CreatePageUseCase);
    const createResult = await createPage.execute(pageMocks.pageB);
    if (createResult.isFail()) {
        throw createResult.error;
    }
    const publishPage = ctx.container.resolve(PublishPageUseCase);
    const publishResult = await publishPage.execute({ id: createResult.value.id });
    if (publishResult.isFail()) {
        throw publishResult.error;
    }
    return createResult.value;
};

describe("Pages Own Scope Permissions", () => {
    // ========================================================================
    // GET operations
    // ========================================================================
    describe("GetPageById", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        it("should deny access when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const getPageById = ctx.container.resolve(GetPageByIdUseCase);
            const result = await getPageById.execute(seedPageId);
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow access when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const getPageById = ctx.container.resolve(GetPageByIdUseCase);
            const result = await getPageById.execute(seedPageId);
            expect(result.isFail()).toBe(false);
        });

        it("should allow access with full permissions (no own flag)", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const getPageById = ctx.container.resolve(GetPageByIdUseCase);
            const result = await getPageById.execute(seedPageId);
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // LIST operations
    // ========================================================================
    describe("ListPages", () => {
        beforeEach(async () => {
            // Create pages as identityA
            const handlerA = useHandler({ identity: identityA });
            const ctxA = await handlerA.handler();
            const createPage = ctxA.container.resolve(CreatePageUseCase);
            await createPage.execute(pageMocks.pageA);
            await createPage.execute(pageMocks.pageB);

            // Create a page as identityB
            const handlerB = useHandler({ identity: identityB });
            const ctxB = await handlerB.handler();
            const createPageB = ctxB.container.resolve(CreatePageUseCase);
            await createPageB.execute(pageMocks.pageC);
        });

        it("should only return own pages when own=true for identityA", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const listPages = ctx.container.resolve(ListPagesUseCase);
            const result = await listPages.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.pages.length).toBe(2);
            for (const page of result.value.pages) {
                expect(page.createdBy?.id).toBe(identityA.id);
            }
        });

        it("should only return own pages when own=true for identityB", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const listPages = ctx.container.resolve(ListPagesUseCase);
            const result = await listPages.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.pages.length).toBe(1);
            for (const page of result.value.pages) {
                expect(page.createdBy?.id).toBe(identityB.id);
            }
        });

        it("should return all pages with full permissions", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const listPages = ctx.container.resolve(ListPagesUseCase);
            const result = await listPages.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.pages.length).toBe(3);
        });
    });

    // ========================================================================
    // UPDATE operations
    // ========================================================================
    describe("UpdatePage", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        it("should deny update when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, rwd: "rw" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const updatePage = ctx.container.resolve(UpdatePageUseCase);
            const result = await updatePage.execute(seedPageId, {
                properties: { title: "Updated" }
            });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow update when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, rwd: "rw" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const updatePage = ctx.container.resolve(UpdatePageUseCase);
            const result = await updatePage.execute(seedPageId, {
                properties: { title: "Updated" }
            });
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // DELETE operations
    // ========================================================================
    describe("DeletePage", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        it("should deny delete when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, rwd: "rwd" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const deletePage = ctx.container.resolve(DeletePageUseCase);
            const result = await deletePage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow delete when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, rwd: "rwd" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const deletePage = ctx.container.resolve(DeletePageUseCase);
            const result = await deletePage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // PUBLISH operations
    // ========================================================================
    describe("PublishPage", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        it("should deny publish when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, pw: "p" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const publishPage = ctx.container.resolve(PublishPageUseCase);
            const result = await publishPage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow publish when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, pw: "p" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const publishPage = ctx.container.resolve(PublishPageUseCase);
            const result = await publishPage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // UNPUBLISH operations
    // ========================================================================
    describe("UnpublishPage", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createAndPublishSeedPage();
            seedPageId = page.id;
        });

        it("should deny unpublish when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, pw: "u" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const unpublishPage = ctx.container.resolve(UnpublishPageUseCase);
            const result = await unpublishPage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow unpublish when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.page", own: true, pw: "u" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const unpublishPage = ctx.container.resolve(UnpublishPageUseCase);
            const result = await unpublishPage.execute({ id: seedPageId });
            expect(result.isFail()).toBe(false);
        });
    });
});
