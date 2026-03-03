import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const NOT_AUTHORIZED = "WebsiteBuilder/Redirect/NotAuthorized";

const identityA: IdentityData = { id: "identity-a", type: "admin", displayName: "User A" };
const identityB: IdentityData = { id: "identity-b", type: "admin", displayName: "User B" };

/**
 * Helper: creates a redirect as identityA with full permissions.
 */
const createSeedRedirect = async () => {
    const handler = useHandler({ identity: identityA });
    const ctx = await handler.handler();
    const createRedirect = ctx.container.resolve(CreateRedirectUseCase);
    const result = await createRedirect.execute(redirectMocks.redirectA);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Redirects Own Scope Permissions", () => {
    // ========================================================================
    // GET operations
    // ========================================================================
    describe("GetRedirectById", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        it("should deny access when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const getRedirectById = ctx.container.resolve(GetRedirectByIdUseCase);
            const result = await getRedirectById.execute(seedRedirectId);
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow access when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const getRedirectById = ctx.container.resolve(GetRedirectByIdUseCase);
            const result = await getRedirectById.execute(seedRedirectId);
            expect(result.isFail()).toBe(false);
        });

        it("should allow access with full permissions (no own flag)", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const getRedirectById = ctx.container.resolve(GetRedirectByIdUseCase);
            const result = await getRedirectById.execute(seedRedirectId);
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // LIST operations
    // ========================================================================
    describe("ListRedirects", () => {
        beforeEach(async () => {
            // Create redirects as identityA
            const handlerA = useHandler({ identity: identityA });
            const ctxA = await handlerA.handler();
            const createRedirect = ctxA.container.resolve(CreateRedirectUseCase);
            await createRedirect.execute(redirectMocks.redirectA);
            await createRedirect.execute(redirectMocks.redirectB);

            // Create a redirect as identityB
            const handlerB = useHandler({ identity: identityB });
            const ctxB = await handlerB.handler();
            const createRedirectB = ctxB.container.resolve(CreateRedirectUseCase);
            await createRedirectB.execute(redirectMocks.redirectC);
        });

        it("should only return own redirects when own=true for identityA", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const listRedirects = ctx.container.resolve(ListRedirectsUseCase);
            const result = await listRedirects.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.redirects.length).toBe(2);
            for (const redirect of result.value.redirects) {
                expect(redirect.createdBy?.id).toBe(identityA.id);
            }
        });

        it("should only return own redirects when own=true for identityB", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const listRedirects = ctx.container.resolve(ListRedirectsUseCase);
            const result = await listRedirects.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.redirects.length).toBe(1);
            for (const redirect of result.value.redirects) {
                expect(redirect.createdBy?.id).toBe(identityB.id);
            }
        });

        it("should return all redirects with full permissions", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const listRedirects = ctx.container.resolve(ListRedirectsUseCase);
            const result = await listRedirects.execute({
                where: {},
                limit: 100,
                after: null,
                sort: []
            });
            expect(result.isFail()).toBe(false);
            expect(result.value.redirects.length).toBe(3);
        });
    });

    // ========================================================================
    // UPDATE operations
    // ========================================================================
    describe("UpdateRedirect", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        it("should deny update when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rw" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const updateRedirect = ctx.container.resolve(UpdateRedirectUseCase);
            const result = await updateRedirect.execute(seedRedirectId, {});
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow update when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rw" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const updateRedirect = ctx.container.resolve(UpdateRedirectUseCase);
            const result = await updateRedirect.execute(seedRedirectId, {});
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // DELETE operations
    // ========================================================================
    describe("DeleteRedirect", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        it("should deny delete when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rwd" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const deleteRedirect = ctx.container.resolve(DeleteRedirectUseCase);
            const result = await deleteRedirect.execute({ id: seedRedirectId });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow delete when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rwd" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const deleteRedirect = ctx.container.resolve(DeleteRedirectUseCase);
            const result = await deleteRedirect.execute({ id: seedRedirectId });
            expect(result.isFail()).toBe(false);
        });
    });

    // ========================================================================
    // MOVE operations
    // ========================================================================
    describe("MoveRedirect", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        it("should deny move when own=true and identity does not match", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rw" }],
                identity: identityB
            });
            const ctx = await handler.handler();
            const moveRedirect = ctx.container.resolve(MoveRedirectUseCase);
            const result = await moveRedirect.execute({
                id: seedRedirectId,
                folderId: "another-folder"
            });
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        });

        it("should allow move when own=true and identity matches", async () => {
            const handler = useHandler({
                permissions: [{ name: "wb.redirect", own: true, rwd: "rw" }],
                identity: identityA
            });
            const ctx = await handler.handler();
            const moveRedirect = ctx.container.resolve(MoveRedirectUseCase);
            const result = await moveRedirect.execute({
                id: seedRedirectId,
                folderId: "another-folder"
            });
            expect(result.isFail()).toBe(false);
        });
    });
});
