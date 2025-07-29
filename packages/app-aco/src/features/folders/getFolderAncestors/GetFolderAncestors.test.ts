import { folderCacheFactory } from "../cache/FoldersCacheFactory";
import { Folder } from "../Folder";
import { GetFolderAncestors } from "./GetFolderAncestors";

describe("GetFolderAncestors", () => {
    const type = "abc";
    const foldersCache = folderCacheFactory.getCache(type);

    beforeEach(() => {
        foldersCache.clear();
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
    });

    it("should return all ancestors of a folder", () => {
        const getFolderAncestors = GetFolderAncestors.getInstance(type);

        const ancestors = getFolderAncestors.execute({
            id: "folder-4"
        });

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
        const getFolderAncestors = GetFolderAncestors.getInstance(type);

        const ancestors = getFolderAncestors.execute({
            id: "folder-1"
        });

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
        const getFolderAncestors = GetFolderAncestors.getInstance(type);

        const ancestors = getFolderAncestors.execute({
            id: "non-existing-folder"
        });

        expect(ancestors).toEqual([]);
    });
});
