import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { LoadingRepository } from "@webiny/app-utils";
import { ROOT_FOLDER } from "~/constants.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { LoadedCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { ListFoldersByParentIdsFeature } from "./feature.js";
import { ListFoldersByParentIdsGateway } from "./abstractions.js";
import { ListFoldersByParentIdsUseCase } from "./abstractions.js";
import { LoadedFoldersCache } from "~/features/folders/abstractions.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";

describe("ListFoldersByParentIds", () => {
    const type = "abc";

    function setupTest(gateway: ListFoldersByParentIdsGateway.Interface) {
        const container = new Container();
        const foldersCache = new ListCache<Folder>();
        const loadedFoldersCache = new LoadedCache();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);
        container.registerInstance(LoadedFoldersCache, loadedFoldersCache);
        container.registerInstance(FoldersLoadingRepository, new LoadingRepository());

        ListFoldersByParentIdsFeature.register(container);
        container.registerInstance(ListFoldersByParentIdsGateway, gateway);

        return {
            container,
            foldersCache,
            useCase: container.resolve(ListFoldersByParentIdsUseCase)
        };
    }

    beforeEach(() => {
        vi.resetAllMocks();
    });

    class ListFoldersByParentIdsMockGateway implements ListFoldersByParentIdsGateway.Interface {
        mockResponse: FolderDto[];

        // Had to use `any` as the mock folders passed in the tests below are also partial objects.
        constructor(mockResponse: any) {
            this.mockResponse = mockResponse as FolderDto[];
        }

        setMockResponse(mockResponse: any) {
            this.mockResponse = mockResponse as FolderDto[];
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

        const { useCase, foldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);
        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(type, [ROOT_FOLDER]);

        expect(foldersCache.hasItems()).toBe(true);
        expect(foldersCache.count()).toEqual(3);

        // This call should be idempotent: the number of elements in cache should not change
        await useCase.execute();
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

        const { useCase, foldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);
        await useCase.execute(["folder-0"]);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(type, ["folder-0"]);

        expect(foldersCache.hasItems()).toBe(true);
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

        await useCase.execute(["folder-1"]);
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

        const { useCase } = setupTest(gateway);

        // Execute the useCase 3 times and check the gateway is invoked only when needed
        await useCase.execute(["folder-0", "folder-1"]);

        gateway.setMockResponse([
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                parentId: "folder-2",
                type
            }
        ]);

        await useCase.execute(["folder-0", "folder-1", "folder-2"]);
        await useCase.execute(["folder-0", "folder-1", "folder-2"]);

        expect(spy).toHaveBeenNthCalledWith(1, type, ["folder-0", "folder-1"]);
        expect(spy).toHaveBeenNthCalledWith(2, type, ["folder-2"]);
        expect(gateway.execute).not.toHaveBeenCalledTimes(3);
    });

    it("should return empty array if no folders are found", async () => {
        class ListFoldersByParentIdsEmptyMockGateway
            implements ListFoldersByParentIdsGateway.Interface
        {
            async execute() {
                return [];
            }
        }

        const gateway = new ListFoldersByParentIdsEmptyMockGateway();
        const spy = vi.spyOn(gateway, "execute");

        const { useCase, foldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);

        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(false);

        const items = foldersCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        class ListFoldersByParentIdsErrorMockGateway
            implements ListFoldersByParentIdsGateway.Interface
        {
            async execute(): Promise<FolderDto[]> {
                throw new Error("Gateway error");
            }
        }

        const errorGateway = new ListFoldersByParentIdsErrorMockGateway();
        const spy = vi.spyOn(errorGateway, "execute");

        const { useCase, foldersCache } = setupTest(errorGateway);

        expect(foldersCache.hasItems()).toBe(false);

        await expect(useCase.execute()).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(false);
    });
});
