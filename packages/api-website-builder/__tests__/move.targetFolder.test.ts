import { describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { MovePageUseCase } from "~/features/pages/MovePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";

const createContext = async () => {
    const handler = useHandler({ aco: true });
    return handler.handler();
};

const createFolder = async (
    context: Awaited<ReturnType<typeof createContext>>,
    type: string,
    slug: string
) => {
    const result = await context.container.resolve(CreateFolderUseCase).execute({
        title: slug,
        slug,
        type,
        parentId: null
    });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Move page / redirect - target folder validation", () => {
    describe("MovePage", () => {
        it("should move a page into an existing page folder", async () => {
            const context = await createContext();
            const page = (
                await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA)
            ).value;
            const folder = await createFolder(context, "wb:page", "pages-folder");

            const result = await context.container.resolve(MovePageUseCase).execute({
                id: page.id,
                folderId: folder.id
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.location.folderId).toBe(folder.id);

            // Read with a new context: this context's storage data loader still caches the old entry.

            const stored = await (
                await createContext()
            ).container
                .resolve(GetPageByIdUseCase)
                .execute(page.id);
            expect(stored.value.location.folderId).toBe(folder.id);
        });

        it("should allow moving a page back to the root folder", async () => {
            const context = await createContext();
            const page = (
                await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA)
            ).value;

            const result = await context.container.resolve(MovePageUseCase).execute({
                id: page.id,
                folderId: "root"
            });

            expect(result.isOk()).toBe(true);
        });

        it("should not move a page into a non-existing folder", async () => {
            const context = await createContext();
            const page = (
                await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA)
            ).value;

            const result = await context.container.resolve(MovePageUseCase).execute({
                id: page.id,
                folderId: "non-existing-folder"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("WebsiteBuilder/Page/ValidationError");
        });

        it("should not move a page into a folder of another type", async () => {
            const context = await createContext();
            const page = (
                await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA)
            ).value;
            const redirectFolder = await createFolder(context, "wb:redirect", "redirects-folder");
            const cmsFolder = await createFolder(context, "cms:article", "cms-folder");

            for (const folder of [redirectFolder, cmsFolder]) {
                const result = await context.container.resolve(MovePageUseCase).execute({
                    id: page.id,
                    folderId: folder.id
                });

                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("WebsiteBuilder/Page/ValidationError");
            }
        });
    });

    describe("MoveRedirect", () => {
        it("should move a redirect into an existing redirect folder", async () => {
            const context = await createContext();
            const redirect = (
                await context.container
                    .resolve(CreateRedirectUseCase)
                    .execute(redirectMocks.redirectA)
            ).value;
            const folder = await createFolder(context, "wb:redirect", "redirects-folder");

            const result = await context.container.resolve(MoveRedirectUseCase).execute({
                id: redirect.id,
                folderId: folder.id
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.location.folderId).toBe(folder.id);

            // Read with a new context: this context's storage data loader still caches the old entry.
            const stored = await (
                await createContext()
            ).container
                .resolve(GetRedirectByIdUseCase)
                .execute(redirect.id);
            expect(stored.value.location.folderId).toBe(folder.id);
        });

        it("should not move a redirect into a non-existing folder", async () => {
            const context = await createContext();
            const redirect = (
                await context.container
                    .resolve(CreateRedirectUseCase)
                    .execute(redirectMocks.redirectA)
            ).value;

            const result = await context.container.resolve(MoveRedirectUseCase).execute({
                id: redirect.id,
                folderId: "non-existing-folder"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("WebsiteBuilder/Redirect/ValidationError");
        });

        it("should not move a redirect into a page folder", async () => {
            const context = await createContext();
            const redirect = (
                await context.container
                    .resolve(CreateRedirectUseCase)
                    .execute(redirectMocks.redirectA)
            ).value;
            const folder = await createFolder(context, "wb:page", "pages-folder");

            const result = await context.container.resolve(MoveRedirectUseCase).execute({
                id: redirect.id,
                folderId: folder.id
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("WebsiteBuilder/Redirect/ValidationError");
        });
    });

    it("should reject non-root folders when ACO is not registered", async () => {
        const context = await useHandler({}).handler();
        const page = (await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA))
            .value;

        const result = await context.container.resolve(MovePageUseCase).execute({
            id: page.id,
            folderId: "another-folder"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Page/ValidationError");
    });
});
