import { beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { AcoFeature } from "@webiny/api-aco";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import {
    CreateFolderUseCase,
    DeleteFolderUseCase
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";

/*
 * Website Builder folders hold pages and redirects. ACO only checks for child folders, so the
 * Website Builder has to refuse to delete a folder that still has its own content in it.
 */
describe("Deleting Website Builder folders", () => {
    let container: Container;

    beforeEach(async () => {
        // The test handler doesn't load ACO, which owns folders, so this test adds it.
        const acoStorage = getStorageOps("aco");
        const handler = useHandler({
            legacyPlugins: [...acoStorage.plugins, (c: Container) => AcoFeature.register(c)]
        });
        ({ container } = await handler.handler());
    });

    const createFolder = async (type: string) => {
        const result = await container.resolve(CreateFolderUseCase).execute({
            title: "Folder",
            slug: `folder-${type.replace(":", "-")}`,
            type,
            parentId: null
        });
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    };

    const deleteFolder = (id: string) => container.resolve(DeleteFolderUseCase).execute(id);

    it("should not delete a page folder that has a page in it", async () => {
        const folder = await createFolder("wb:page");
        const page = await container.resolve(CreatePageUseCase).execute({
            ...pageMocks.pageA,
            location: { folderId: folder.id }
        });
        expect(page.isOk()).toBe(true);

        const result = await deleteFolder(folder.id);
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Aco/Folder/NotEmpty");
    });

    it("should delete an empty page folder", async () => {
        const folder = await createFolder("wb:page");

        const result = await deleteFolder(folder.id);
        expect(result.isOk()).toBe(true);
    });

    it("should not delete a redirect folder that has a redirect in it", async () => {
        const folder = await createFolder("wb:redirect");
        const redirect = await container.resolve(CreateRedirectUseCase).execute({
            ...redirectMocks.redirectA,
            location: { folderId: folder.id }
        });
        expect(redirect.isOk()).toBe(true);

        const result = await deleteFolder(folder.id);
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Aco/Folder/NotEmpty");
    });

    it("should delete an empty redirect folder", async () => {
        const folder = await createFolder("wb:redirect");

        const result = await deleteFolder(folder.id);
        expect(result.isOk()).toBe(true);
    });
});
