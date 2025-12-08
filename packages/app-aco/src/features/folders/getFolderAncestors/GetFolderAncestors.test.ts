import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { GetFolderAncestorsFeature } from "~/features/folders/getFolderAncestors/feature.js";
import { GetFolderAncestorsUseCase } from "~/features/folders/getFolderAncestors/abstractions.js";

describe("GetFolderAncestors", () => {
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

        GetFolderAncestorsFeature.register(container);

        return { container, foldersCache, useCase: container.resolve(GetFolderAncestorsUseCase) };
    }

    it("should return all ancestors of a folder", () => {
        const { useCase } = setupTest();

        const ancestors = useCase.execute("folder-4");

        expect(ancestors).toEqual([
            {
                id: "folder-4",
                title: "Folder 4",
                slug: "folder-4",
                permissions: [],
                type,
                parentId: "folder-3"
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                permissions: [],
                type,
                parentId: "folder-2"
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-2",
                permissions: [],
                type,
                parentId: null
            }
        ]);
    });

    it("should return an empty array if the folder has no ancestors", () => {
        const { useCase } = setupTest();

        const ancestors = useCase.execute("folder-1");

        expect(ancestors).toEqual([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                permissions: [],
                type,
                parentId: null
            }
        ]);
    });

    it("should return an empty array if the folder does not exist", () => {
        const { useCase } = setupTest();

        const ancestors = useCase.execute("non-existing-folder");

        expect(ancestors).toEqual([]);
    });
});
