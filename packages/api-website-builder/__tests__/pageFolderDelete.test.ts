import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { processLegacyPlugins } from "@webiny/api-headless-cms-testing";
import { AcoFeature } from "@webiny/api-aco";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

// Plain container function: runs after setup, like api-aco/__tests__/utils/useHandler.ts.
const registerAco = (container: Container) => {
    processLegacyPlugins(container, getStorageOps<any>("aco").plugins);
    AcoFeature.register(container);
    container.register(NoopFolderLevelPermissions);
};

const createFolder = async (context: ApiCoreContext) => {
    const create = context.container.resolve(CreateFolderUseCase);
    const result = await create.execute({
        title: "Landing pages",
        slug: "landing-pages",
        type: "wb:page",
        parentId: null
    });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Deleting Website Builder page folders", () => {
    it("blocks deleting a wb:page folder that contains a page", async () => {
        const { handler } = useHandler({ legacyPlugins: [registerAco] });
        const context = await handler();
        const folder = await createFolder(context);

        const createPage = context.container.resolve(CreatePageUseCase);
        const pageResult = await createPage.execute({
            ...pageMocks.pageA,
            location: { folderId: folder.id }
        });
        expect(pageResult.isOk()).toBe(true);

        const deleteFolder = context.container.resolve(DeleteFolderUseCase);
        const result = await deleteFolder.execute(folder.id);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Aco/Folder/NotEmpty");
    });

    it("allows deleting an empty wb:page folder", async () => {
        const { handler } = useHandler({ legacyPlugins: [registerAco] });
        const context = await handler();
        const folder = await createFolder(context);

        const deleteFolder = context.container.resolve(DeleteFolderUseCase);
        const result = await deleteFolder.execute(folder.id);

        expect(result.isOk()).toBe(true);
    });

    it("blocks deleting a wb:page folder whose pages are hidden by own-scope permissions", async () => {
        const identityA = { id: "identity-a", type: "admin" as const, displayName: "User A" };
        const identityB = { id: "identity-b", type: "admin" as const, displayName: "User B" };

        const handlerA = useHandler({ identity: identityA, legacyPlugins: [registerAco] });
        const contextA = await handlerA.handler();
        const folder = await createFolder(contextA);
        const createPage = contextA.container.resolve(CreatePageUseCase);
        const pageResult = await createPage.execute({
            ...pageMocks.pageA,
            location: { folderId: folder.id }
        });
        expect(pageResult.isOk()).toBe(true);

        const handlerB = useHandler({
            identity: identityB,
            permissions: [{ name: "wb.page", own: true }, { name: "aco.folder" }],
            legacyPlugins: [registerAco]
        });
        const contextB = await handlerB.handler();
        const deleteFolder = contextB.container.resolve(DeleteFolderUseCase);
        const result = await deleteFolder.execute(folder.id);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Aco/Folder/NotEmpty");
    });
});
