import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "~/features/pages/UnpublishPage/index.js";
import { DuplicatePageUseCase } from "~/features/pages/DuplicatePage/index.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";
import { DeletePageUseCase } from "~/features/pages/DeletePage/index.js";
import { MovePageUseCase } from "~/features/pages/MovePage/index.js";
import { TrashPageUseCase } from "~/features/pages/TrashPage/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

const NOT_AUTHORIZED = "WebsiteBuilder/Page/NotAuthorized";

/**
 * Helper: creates a page using a full-access handler and returns page data.
 */
const createSeedPage = async () => {
    const handler = useHandler({});
    const ctx = await handler.handler();
    const createPage = ctx.container.resolve(CreatePageUseCase);
    const result = await createPage.execute(pageMocks.pageA);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Pages Fine-Grained Permissions", () => {
    // ========================================================================
    // READ operations
    // ========================================================================
    describe("Read operations (GetPageById, GetPageByPath, GetPageRevisions, ListPages)", () => {
        describe("insufficient permissions", () => {
            it("should deny read with no permissions", async () => {
                const handler = useHandler({ permissions: [] });
                const context = await handler.handler();

                const getById = context.container.resolve(GetPageByIdUseCase);
                const r1 = await getById.execute("some-id");
                expect(r1.isFail()).toBe(true);
                expect(r1.error.code).toBe(NOT_AUTHORIZED);

                const getByPath = context.container.resolve(GetPageByPathUseCase);
                const r2 = await getByPath.execute("/some-path");
                expect(r2.isFail()).toBe(true);
                expect(r2.error.code).toBe(NOT_AUTHORIZED);

                const getRevisions = context.container.resolve(GetPageRevisionsUseCase);
                const r3 = await getRevisions.execute("some-entry-id");
                expect(r3.isFail()).toBe(true);
                expect(r3.error.code).toBe(NOT_AUTHORIZED);

                const listPages = context.container.resolve(ListPagesUseCase);
                const r4 = await listPages.execute({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                });
                expect(r4.isFail()).toBe(true);
                expect(r4.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.page", permissions: [{ name: "wb.page" }] },
                { label: "rwd=r", permissions: [{ name: "wb.page", rwd: "r" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.page", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.page", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow read with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const listPages = context.container.resolve(ListPagesUseCase);
                const r = await listPages.execute({
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
    describe("Create operations (CreatePage, CreatePageRevisionFrom, DuplicatePage)", () => {
        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no w)", permissions: [{ name: "wb.page", rwd: "r" }] }
            ])("should deny create with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const createPage = context.container.resolve(CreatePageUseCase);
                const r1 = await createPage.execute(pageMocks.pageA);
                expect(r1.isFail()).toBe(true);
                expect(r1.error.code).toBe(NOT_AUTHORIZED);

                const createRevision = context.container.resolve(CreatePageRevisionFromUseCase);
                const r2 = await createRevision.execute({ id: "some-id" });
                expect(r2.isFail()).toBe(true);
                expect(r2.error.code).toBe(NOT_AUTHORIZED);

                const duplicatePage = context.container.resolve(DuplicatePageUseCase);
                const r3 = await duplicatePage.execute({ id: "some-id" });
                expect(r3.isFail()).toBe(true);
                expect(r3.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.page", permissions: [{ name: "wb.page" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.page", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.page", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow create with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const createPage = context.container.resolve(CreatePageUseCase);
                const r = await createPage.execute(pageMocks.pageA);
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // EDIT operations
    // ========================================================================
    describe("Edit operations (UpdatePage, MovePage)", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no w)", permissions: [{ name: "wb.page", rwd: "r" }] }
            ])("should deny edit with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const updatePage = context.container.resolve(UpdatePageUseCase);
                const r1 = await updatePage.execute(seedPageId, {
                    properties: { title: "Updated" }
                });
                expect(r1.isFail()).toBe(true);
                expect(r1.error.code).toBe(NOT_AUTHORIZED);

                const movePage = context.container.resolve(MovePageUseCase);
                const r2 = await movePage.execute({
                    id: seedPageId,
                    folderId: "another-folder"
                });
                expect(r2.isFail()).toBe(true);
                expect(r2.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.page", permissions: [{ name: "wb.page" }] },
                { label: "rwd=rw", permissions: [{ name: "wb.page", rwd: "rw" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.page", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow edit with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const updatePage = context.container.resolve(UpdatePageUseCase);
                const r = await updatePage.execute(seedPageId, {
                    properties: { title: "Updated" }
                });
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // DELETE operations
    // ========================================================================
    describe("Delete operations (DeletePage)", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        describe("insufficient permissions", () => {
            const permissions = [
                { label: "no permissions", permissions: [] },
                { label: "rwd=r (no d)", permissions: [{ name: "wb.page", rwd: "r" }] },
                { label: "rwd=rw (no d)", permissions: [{ name: "wb.page", rwd: "rw" }] }
            ];

            it.each(permissions)("should deny trash with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();
                // first we need to trash the page, as only trashed pages can be deleted
                const trashPage = context.container.resolve(TrashPageUseCase);
                // we will act like trashing is possible at this point. we tested trash permissions in another test
                const trashResult = await trashPage.execute({ id: seedPageId });
                expect(trashResult.isFail()).toBe(true);
                expect(trashResult.error.code).toBe(NOT_AUTHORIZED);
            });

            it.each(permissions)("should deny delete with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();
                // first we need to trash the page, as only trashed pages can be deleted
                const trashPage = context.container.resolve(TrashPageUseCase);
                // we will act like trashing is possible at this point. we tested trash permissions in another test
                const trashResult = await context.container
                    .resolve(IdentityContext)
                    .withoutAuthorization(async () => {
                        return trashPage.execute({ id: seedPageId });
                    });
                expect(trashResult.isOk()).toBeTrue();

                const deletePage = context.container.resolve(DeletePageUseCase);
                const r = await deletePage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(true);
                expect(r.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "unrestricted wb.page", permissions: [{ name: "wb.page" }] },
                { label: "rwd=rwd", permissions: [{ name: "wb.page", rwd: "rwd" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow delete with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const trashPage = context.container.resolve(TrashPageUseCase);
                // we will act like trashing is possible at this point. we tested trash permissions in another test
                const trashResult = await trashPage.execute({ id: seedPageId });
                expect(trashResult.isOk()).toBe(true);

                const deletePage = context.container.resolve(DeletePageUseCase);
                const r = await deletePage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // PUBLISH operations
    // ========================================================================
    describe("Publish operations (PublishPage)", () => {
        let seedPageId: string;

        beforeEach(async () => {
            const page = await createSeedPage();
            seedPageId = page.id;
        });

        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                {
                    label: "rwd only (no pw)",
                    permissions: [{ name: "wb.page", rwd: "rwd" }]
                },
                { label: "pw=u (no p)", permissions: [{ name: "wb.page", pw: "u" }] }
            ])("should deny publish with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const publishPage = context.container.resolve(PublishPageUseCase);
                const r = await publishPage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(true);
                expect(r.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "pw=p", permissions: [{ name: "wb.page", pw: "p" }] },
                { label: "pw=pu", permissions: [{ name: "wb.page", pw: "pu" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow publish with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const publishPage = context.container.resolve(PublishPageUseCase);
                const r = await publishPage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(false);
            });
        });
    });

    // ========================================================================
    // UNPUBLISH operations
    // ========================================================================
    describe("Unpublish operations (UnpublishPage)", () => {
        let seedPageId: string;

        beforeEach(async () => {
            // Create and publish a page so we can test unpublish
            const handler = useHandler({});
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
            seedPageId = createResult.value.id;
        });

        describe("insufficient permissions", () => {
            it.each([
                { label: "no permissions", permissions: [] },
                { label: "pw=p (no u)", permissions: [{ name: "wb.page", pw: "p" }] }
            ])("should deny unpublish with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const unpublishPage = context.container.resolve(UnpublishPageUseCase);
                const r = await unpublishPage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(true);
                expect(r.error.code).toBe(NOT_AUTHORIZED);
            });
        });

        describe("sufficient permissions", () => {
            it.each([
                { label: "pw=u", permissions: [{ name: "wb.page", pw: "u" }] },
                { label: "pw=pu", permissions: [{ name: "wb.page", pw: "pu" }] },
                { label: "full access wb.*", permissions: [{ name: "wb.*" }] }
            ])("should allow unpublish with $label", async ({ permissions }) => {
                const handler = useHandler({ permissions });
                const context = await handler.handler();

                const unpublishPage = context.container.resolve(UnpublishPageUseCase);
                const r = await unpublishPage.execute({ id: seedPageId });
                expect(r.isFail()).toBe(false);
            });
        });
    });
});
