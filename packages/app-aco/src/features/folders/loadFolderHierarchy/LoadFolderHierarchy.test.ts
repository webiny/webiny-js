import { describe, it, expect, beforeEach, vi } from "vitest";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { loadedFolderCacheFactory } from "../cache/LoadedFoldersCacheFactory.js";
import { Container } from "@webiny/di";
import { ListCache, LoadedCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import {
    FoldersCache,
    FoldersContext,
    FoldersLoadingRepository,
    LoadedFoldersCache
} from "../abstractions.js";
import { LoadingRepository } from "@webiny/app-utils";
import { LoadFolderHierarchyGateway } from "./abstractions.js";
import { LoadFolderHierarchyFeature } from "./feature.js";
import type { LoadFolderHierarchyGatewayResponse } from "./abstractions.js";
import { LoadFolderHierarchyUseCase } from "./abstractions.js";

describe("GetFolderHierarchy", () => {
    const type = "abc";

    function setupTest(gateway: LoadFolderHierarchyGateway.Interface) {
        const container = new Container();
        const foldersCache = new ListCache<Folder>();
        const loadedFoldersCache = new LoadedCache();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);
        container.registerInstance(LoadedFoldersCache, loadedFoldersCache);
        container.registerInstance(FoldersLoadingRepository, new LoadingRepository());

        LoadFolderHierarchyFeature.register(container);
        container.registerInstance(LoadFolderHierarchyGateway, gateway);

        return {
            container,
            foldersCache,
            loadedFoldersCache,
            useCase: container.resolve(LoadFolderHierarchyUseCase)
        };
    }

    beforeEach(() => {
        vi.resetAllMocks();
    });

    class GetFolderHierarchyMockGateway implements LoadFolderHierarchyGateway.Interface {
        mockResponse: LoadFolderHierarchyGatewayResponse;

        // Had to use `any` as the mock folders passed in the tests below are also partial objects.
        constructor(mockResponse: any) {
            this.mockResponse = mockResponse as LoadFolderHierarchyGatewayResponse;
        }

        async execute() {
            return this.mockResponse;
        }
    }

    it("should update the list of folders in both `cache` and `loadedCache` when `parents` and `children` are returned by the gateway", async () => {
        const gateway = new GetFolderHierarchyMockGateway({
            parents: [
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
                    parentId: "folder-1",
                    type
                },
                {
                    id: "folder-3",
                    title: "Folder 3",
                    slug: "folder-3",
                    parentId: "folder-2",
                    type
                }
            ],
            siblings: [
                {
                    id: "folder-4",
                    title: "Folder 4",
                    slug: "folder-4",
                    parentId: "folder-3",
                    type
                },
                {
                    id: "folder-5",
                    title: "Folder 5",
                    slug: "folder-5",
                    parentId: "folder-3",
                    type
                }
            ]
        });

        const spy = vi.spyOn(gateway, "execute");

        const { useCase, foldersCache, loadedFoldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);
        expect(loadedFoldersCache.hasItems()).toBe(false);
        await useCase.execute("folder-0");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(type, "folder-0");

        expect(foldersCache.hasItems()).toBe(true);
        expect(foldersCache.count()).toEqual(5);
        // We are storing only the parent folders id in the loadedFoldersCache
        expect(loadedFoldersCache.count()).toEqual(3);
        expect(loadedFoldersCache.getItems()).toEqual(["folder-1", "folder-2", "folder-3"]);

        // This call should be idempotent: the number of elements in cache should not change
        await useCase.execute("folder-0");
        expect(foldersCache.count()).toEqual(5);
        expect(loadedFoldersCache.count()).toEqual(3);
    });

    it("should only  update the list of folders in `cache` when `children` are returned by the gateway", async () => {
        const gateway = new GetFolderHierarchyMockGateway({
            parents: [],
            siblings: [
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
                }
            ]
        });

        const spy = vi.spyOn(gateway, "execute");

        const { useCase, foldersCache, loadedFoldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);
        expect(loadedFoldersCache.hasItems()).toBe(false);
        await useCase.execute("folder-0");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(type, "folder-0");

        expect(foldersCache.hasItems()).toBe(true);
        expect(foldersCache.count()).toEqual(2);
        // We are NOT storing any folder loadedFoldersCache
        expect(loadedFoldersCache.hasItems()).toBe(false);
    });

    it("should handle gateway errors gracefully", async () => {
        class GetFolderHierarchyErrorMockGateway implements LoadFolderHierarchyGateway.Interface {
            async execute(): LoadFolderHierarchyGateway.Return {
                throw new Error("Gateway error");
            }
        }

        const gateway = new GetFolderHierarchyErrorMockGateway();
        const spy = vi.spyOn(gateway, "execute");

        const { useCase, foldersCache } = setupTest(gateway);

        expect(foldersCache.hasItems()).toBe(false);

        await expect(useCase.execute("folder-0")).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(false);
    });
});
