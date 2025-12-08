import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { GetDescendantFoldersUseCase } from "~/features/folders/getDescendantFolders/abstractions.js";
import { GetDescendantFoldersFeature } from "~/features/folders/getDescendantFolders/feature.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";

describe("GetDescendantFolders", () => {
    const type = "abc";

    function setupTest() {
        const container = new Container();
        const foldersCache = new ListCache<Folder>();

        foldersCache.addItems([
            Folder.create({
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: null,
                permissions: [],
                type
            }),
            Folder.create({
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-2",
                parentId: null,
                permissions: [],
                type
            }),
            Folder.create({
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: "folder-2",
                permissions: [],
                type
            }),
            Folder.create({
                id: "folder-4",
                title: "Folder 4",
                slug: "folder-4",
                parentId: "folder-3",
                permissions: [],
                type
            }),
            Folder.create({
                id: "folder-5",
                title: "Folder 5",
                slug: "folder-5",
                parentId: "folder-3",
                permissions: [],
                type
            })
        ]);

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);

        GetDescendantFoldersFeature.register(container);

        return { container, foldersCache, useCase: container.resolve(GetDescendantFoldersUseCase) };
    }

    it("should return all descendants of a folder", async () => {
        const { useCase } = setupTest();

        const descendants = useCase.execute("folder-2");

        expect(descendants).toEqual([
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-2",
                parentId: null,
                permissions: [],
                type
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: "folder-2",
                permissions: [],
                type
            },
            {
                id: "folder-4",
                title: "Folder 4",
                slug: "folder-4",
                parentId: "folder-3",
                permissions: [],
                type
            },
            {
                id: "folder-5",
                title: "Folder 5",
                slug: "folder-5",
                parentId: "folder-3",
                permissions: [],
                type
            }
        ]);
    });

    it("should return the folder it self in case no descendants are found", async () => {
        const { useCase } = setupTest();

        const descendants = useCase.execute("folder-1");

        expect(descendants).toEqual([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: null,
                permissions: [],
                type
            }
        ]);
    });

    it("should return empty array if folder does not exist", async () => {
        const { useCase } = setupTest();

        const descendants = useCase.execute("non-existent-folder");

        expect(descendants).toEqual([]);
    });
});
