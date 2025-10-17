import { describe, it, expect, beforeEach, vi } from "vitest";
import { ListFolders } from "./ListFolders.js";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import type { IListFoldersGateway } from "~/features/folders/listFolders/IListFoldersGateway.js";
import type { FolderGqlDto } from "~/features/folders/listFolders/FolderGqlDto.js";

describe("ListFolders", () => {
    class ListFoldersMockGateway implements IListFoldersGateway {
        async execute() {
            return [
                {
                    id: "folder-1",
                    title: "Folder 1",
                    slug: "folder-1",
                    type
                },
                {
                    id: "folder-2",
                    title: "Folder 2",
                    slug: "folder-1",
                    type
                },
                {
                    id: "folder-3",
                    title: "Folder 3",
                    slug: "folder-3",
                    type
                }
            ] as FolderGqlDto[];
        }
    }

    const type = "abc";

    const foldersCache = folderCacheFactory.getCache(type);

    beforeEach(() => {
        foldersCache.clear();
        vi.clearAllMocks();
    });

    it("should be able to list folders", async () => {
        const gateway = new ListFoldersMockGateway();
        const listFolders = ListFolders.getInstance(type, gateway);

        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeTrue();

        const items = foldersCache.getItems();
        expect(items.length).toEqual(3);
    });

    it("should return empty array if no folders are found", async () => {
        class ListFoldersEmptyMockGateway implements IListFoldersGateway {
            async execute() {
                return [];
            }
        }

        const emptyGateway = new ListFoldersEmptyMockGateway();
        const listFolders = ListFolders.getInstance(type, emptyGateway);
        const spy = vi.spyOn(emptyGateway, "execute");

        expect(foldersCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();

        const items = foldersCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        class ListFoldersErrorMockGateway implements IListFoldersGateway {
            async execute(): Promise<FolderGqlDto[]> {
                throw new Error("Gateway error");
            }
        }

        const errorGateway = new ListFoldersErrorMockGateway();
        const listFolders = ListFolders.getInstance(type, errorGateway);
        const spy = vi.spyOn(errorGateway, "execute");

        expect(foldersCache.hasItems()).toBeFalse();

        await expect(listFolders.useCase.execute()).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();
    });

    it("should NOT cache folders after listing", async () => {
        const gateway = new ListFoldersMockGateway();
        const listFolders = ListFolders.getInstance(type, gateway);
        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeTrue();

        const items = foldersCache.getItems();
        expect(items.length).toEqual(3);

        // Execute again, it should execute the gateway again
        await listFolders.useCase.execute();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("should clear cache when type changes", async () => {
        const gateway = new ListFoldersMockGateway();
        const listFolders = ListFolders.getInstance(type, gateway);
        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeTrue();

        const newType = "xyz";
        const newFoldersCache = folderCacheFactory.getCache(newType);
        const newListFolders = ListFolders.getInstance(newType, gateway);

        expect(newFoldersCache.hasItems()).toBeFalse();

        await newListFolders.useCase.execute();

        expect(spy).toHaveBeenCalledTimes(2);
        expect(newFoldersCache.hasItems()).toBeTrue();
    });
});
