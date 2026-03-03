import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";

const NOT_AUTHORIZED = "WebsiteBuilder/Redirect/NotAuthorized";

/**
 * Helper: creates a redirect using a full-access handler and returns redirect data.
 */
const createSeedRedirect = async () => {
    const handler = useHandler({});
    const ctx = await handler.handler();
    const createRedirect = ctx.container.resolve(CreateRedirectUseCase);
    const result = await createRedirect.execute(redirectMocks.redirectA);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Redirects Fine-Grained Permissions", () => {
    // ========================================================================
    // READ operations
    // ========================================================================
    describe("Read operations (GetRedirectById, GetActiveRedirects, ListRedirects)", () => {
        describe("insufficient permissions", () => {
            it("should deny read with no permissions", async () => {
                const handler = useHandler({ permissions: [] });
                const context = await handler.handler();

                const getById = context.container.resolve(GetRedirectByIdUseCase);
                const r1 = await getById.execute("some-id");
                expect(r1.isFail()).toBe(true);
                expect(r1.error.code).toBe(NOT_AUTHORIZED);

                const getActive = context.container.resolve(GetActiveRedirectsUseCase);
                const r2 = await getActive.execute();
                expect(r2.isFail()).toBe(true);
                expect(r2.error.code).toBe(NOT_AUTHORIZED);

                const listRedirects = context.container.resolve(ListRedirectsUseCase);
                const r3 = await listRedirects.execute({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                });
                expect(r3.isFail()).toBe(true);
                expect(r3.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.redirect", permissions: [{ name: "wb.redirect" }] },
                { label: "rwd=r", permissions: [{ name: "wb.redirect", rwd: "r" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.redirect", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.redirect", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow read with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const listRedirects = context.container.resolve(ListRedirectsUseCase);
                const r = await listRedirects.execute({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                });
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // CREATE operations
    // ========================================================================
    describe("Create operations (CreateRedirect)", () => {
        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no w)", permissions: [{ name: "wb.redirect", rwd: "r" }] }
            ])("should deny create with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const createRedirect = context.container.resolve(CreateRedirectUseCase);
                const r = await createRedirect.execute(redirectMocks.redirectA);
                expect(r.isFail()).toBe(true);
                expect(r.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.redirect", permissions: [{ name: "wb.redirect" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.redirect", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.redirect", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow create with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const createRedirect = context.container.resolve(CreateRedirectUseCase);
                const r = await createRedirect.execute(redirectMocks.redirectA);
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // EDIT operations
    // ========================================================================
    describe("Edit operations (UpdateRedirect, MoveRedirect)", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no w)", permissions: [{ name: "wb.redirect", rwd: "r" }] }
            ])("should deny edit with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const updateRedirect = context.container.resolve(UpdateRedirectUseCase);
                const r1 = await updateRedirect.execute(seedRedirectId, {});
                expect(r1.isFail()).toBe(true);
                expect(r1.error.code).toBe(NOT_AUTHORIZED);

                const moveRedirect = context.container.resolve(MoveRedirectUseCase);
                const r2 = await moveRedirect.execute({
                    id: seedRedirectId,
                    folderId: "another-folder"
                });
                expect(r2.isFail()).toBe(true);
                expect(r2.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.redirect", permissions: [{ name: "wb.redirect" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.redirect", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.redirect", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow edit with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const updateRedirect = context.container.resolve(UpdateRedirectUseCase);
                const r = await updateRedirect.execute(seedRedirectId, {});
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // DELETE operations
    // ========================================================================
    describe("Delete operations (DeleteRedirect)", () => {
        let seedRedirectId: string;

        beforeEach(async () => {
            const redirect = await createSeedRedirect();
            seedRedirectId = redirect.id;
        });

        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no d)", permissions: [{ name: "wb.redirect", rwd: "r" }] },
                { label: "rwd=rw (no d)", permissions: [{ name: "wb.redirect", rwd: "rw" }] }
            ])("should deny delete with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const deleteRedirect = context.container.resolve(DeleteRedirectUseCase);
                const r = await deleteRedirect.execute({ id: seedRedirectId });
                expect(r.isFail()).toBe(true);
                expect(r.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.redirect", permissions: [{ name: "wb.redirect" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.redirect", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow delete with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const deleteRedirect = context.container.resolve(DeleteRedirectUseCase);
                const r = await deleteRedirect.execute({ id: seedRedirectId });
                expect(r.isFail()).toBe(false);
            });
        });
    });
});
