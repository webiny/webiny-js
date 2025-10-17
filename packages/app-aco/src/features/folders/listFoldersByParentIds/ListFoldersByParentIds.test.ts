import { describe, it, expect, beforeEach, vi } from "vitest";
import { ListFoldersByParentIds } from "./ListFoldersByParentIds.js";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { loadedFolderCacheFactory } from "../cache/LoadedFoldersCacheFactory.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { IListFoldersByParentIdsGateway } from "~/features/folders/listFoldersByParentIds/IListFoldersByParentIdsGateway.js";
import { FolderGqlDto } from "~/features/folders/listFolders/FolderGqlDto.js";

describe("ListFoldersByParentIds", () => {
    const type = "abc";

    const foldersCache = folderCacheFactory.getCache(type);
    const loadedFoldersCache = loadedFolderCacheFactory.getCache(type);

    beforeEach(() => {
        foldersCache.clear();
        loadedFoldersCache.clear();
        vi.resetAllMocks();
    });

    class ListFoldersByParentIdsMockGateway implements IListFoldersByParentIdsGateway {
        mockResponse: FolderGqlDto[];

        // Had to use `any` as the mock folders passed in the tests below are also partial objects.
        constructor(mockResponse: any) {
            this.mockResponse = mockResponse as FolderGqlDto[];
        }

        setMockResponse(mockResponse: any) {
            this.mockResponse = mockResponse as FolderGqlDto[];
        }

        async execute() {
            return this.mockResponse;
        }
    }

    it("should list folders from `ROOT` level if parentIds is `undefined`", async () => {
        const gateway = new ListFoldersByParentIdsMockGateway([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: null,
                type
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-2",
                parentId: null,
                type
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: null,
                type
            }
        ]);

        const spy = vi.spyOn(gateway, "execute");

        const listByParentIdFolders = ListFoldersByParentIds.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();
        await listByParentIdFolders.useCase.execute({ parentIds: undefined });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ parentIds: [ROOT_FOLDER], type });

        expect(foldersCache.hasItems()).toBeTrue();
        expect(foldersCache.count()).toEqual(3);

        // This call should be idempotent: the number of elements in cache should not change
        await listByParentIdFolders.useCase.execute({ parentIds: undefined });
        expect(foldersCache.count()).toEqual(3);
    });

    it("should list folders from the provided `parentIds`", async () => {
        const gateway = new ListFoldersByParentIdsMockGateway([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: "folder-0",
                type
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-1",
                parentId: "folder-0",
                type
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: "folder-0",
                type
            }
        ]);

        const spy = vi.spyOn(gateway, "execute");

        const listByParentIdFolders = ListFoldersByParentIds.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();
        await listByParentIdFolders.useCase.execute({ parentIds: ["folder-0"] });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ parentIds: ["folder-0"], type });

        expect(foldersCache.hasItems()).toBeTrue();
        expect(foldersCache.count()).toEqual(3);

        // The number of folders in cache should increase, since we are changing the parentIds.
        gateway.setMockResponse([
            {
                id: "folder-4",
                title: "Folder 4",
                slug: "folder-4",
                parentId: "folder-1",
                type
            },
            {
                id: "folder-5",
                title: "Folder 5",
                slug: "folder-5",
                parentId: "folder-1",
                type
            },
            {
                id: "folder-6",
                title: "Folder 6",
                slug: "folder-6",
                parentId: "folder-1",
                type
            }
        ]);

        await listByParentIdFolders.useCase.execute({ parentIds: ["folder-1"] });
        expect(foldersCache.count()).toEqual(6);
    });

    it("should list folders from missing `parentIds` stored in cache", async () => {
        const gateway = new ListFoldersByParentIdsMockGateway([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: "folder-0",
                type
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-2",
                parentId: "folder-1",
                type
            }
        ]);

        const spy = vi.spyOn(gateway, "execute");

        const listByParentIdFolders = ListFoldersByParentIds.getInstance(type, gateway);

        // Execute the useCase 3 times and check the gateway is invoked only when needed
        await listByParentIdFolders.useCase.execute({ parentIds: ["folder-0", "folder-1"] });

        gateway.setMockResponse([
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: "folder-2",
                type
            }
        ]);

        await listByParentIdFolders.useCase.execute({
            parentIds: ["folder-0", "folder-1", "folder-2"]
        });
        await listByParentIdFolders.useCase.execute({
            parentIds: ["folder-0", "folder-1", "folder-2"]
        });

        expect(spy).toHaveBeenNthCalledWith(1, {
            parentIds: ["folder-0", "folder-1"],
            type
        });
        expect(spy).toHaveBeenNthCalledWith(2, { parentIds: ["folder-2"], type });
        expect(gateway.execute).not.toHaveBeenCalledTimes(3);
    });

    it("should return empty array if no folders are found", async () => {
        class ListFoldersByParentIdsEmptyMockGateway implements IListFoldersByParentIdsGateway {
            async execute() {
                return [];
            }
        }

        const gateway = new ListFoldersByParentIdsEmptyMockGateway();
        const spy = vi.spyOn(gateway, "execute");

        const listByParentIdFolders = ListFoldersByParentIds.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();

        await listByParentIdFolders.useCase.execute({});

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();

        const items = foldersCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        class ListFoldersByParentIdsErrorMockGateway implements IListFoldersByParentIdsGateway {
            async execute(): Promise<FolderGqlDto[]> {
                throw new Error("Gateway error");
            }
        }

        const errorGateway = new ListFoldersByParentIdsErrorMockGateway();
        const spy = vi.spyOn(errorGateway, "execute");

        const listByParentIdFolders = ListFoldersByParentIds.getInstance(type, errorGateway);

        expect(foldersCache.hasItems()).toBeFalse();

        await expect(listByParentIdFolders.useCase.execute({})).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();
    });

    it("should clear cache when type changes", async () => {
        const gatewayAbc = new ListFoldersByParentIdsMockGateway([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: null,
                type
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-1",
                parentId: null,
                type
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: null,
                type
            }
        ]);

        const spyA = vi.spyOn(gatewayAbc, "execute");

        const newType = "xyz";

        const gatewayXyz = new ListFoldersByParentIdsMockGateway([
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                parentId: null,
                type: newType
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-1",
                parentId: null,
                type: newType
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: null,
                type: newType
            }
        ]);

        const spyX = vi.spyOn(gatewayXyz, "execute");

        const listFoldersByParentId = ListFoldersByParentIds.getInstance(type, gatewayAbc);

        expect(foldersCache.hasItems()).toBeFalse();

        await listFoldersByParentId.useCase.execute({});

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeTrue();

        const newFoldersCache = folderCacheFactory.getCache(newType);
        const newListFoldersByParentId = ListFoldersByParentIds.getInstance(newType, gatewayXyz);

        expect(newFoldersCache.hasItems()).toBeFalse();

        await newListFoldersByParentId.useCase.execute({});

        expect(spyX).toHaveBeenCalledTimes(1);
        expect(newFoldersCache.hasItems()).toBeTrue();
    });
});
