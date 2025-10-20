import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetFolderHierarchy } from "./GetFolderHierarchy.js";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { loadedFolderCacheFactory } from "../cache/LoadedFoldersCacheFactory.js";
import {
    GetFolderHierarchyGatewayResponse,
    IGetFolderHierarchyGateway
} from "~/features/folders/getFolderHierarchy/IGetFolderHierarchyGateway.js";

describe("GetFolderHierarchy", () => {
    const type = "abc";

    const foldersCache = folderCacheFactory.getCache(type);
    const loadedFoldersCache = loadedFolderCacheFactory.getCache(type);

    beforeEach(() => {
        foldersCache.clear();
        loadedFoldersCache.clear();
        vi.resetAllMocks();
    });

    class GetFolderHierarchyMockGateway implements IGetFolderHierarchyGateway {
        mockResponse: GetFolderHierarchyGatewayResponse;

        // Had to use `any` as the mock folders passed in the tests below are also partial objects.
        constructor(mockResponse: any) {
            this.mockResponse = mockResponse as GetFolderHierarchyGatewayResponse;
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

        const getFolderHierarchy = GetFolderHierarchy.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();
        expect(loadedFoldersCache.hasItems()).toBeFalse();
        await getFolderHierarchy.useCase.execute({ id: "folder-0" });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ type, id: "folder-0" });

        expect(foldersCache.hasItems()).toBeTrue();
        expect(foldersCache.count()).toEqual(5);
        // We are storing only the parent folders id in the loadedFoldersCache
        expect(loadedFoldersCache.count()).toEqual(3);
        expect(loadedFoldersCache.getItems()).toEqual(["folder-1", "folder-2", "folder-3"]);

        // This call should be idempotent: the number of elements in cache should not change
        await getFolderHierarchy.useCase.execute({ id: "folder-0" });
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

        const getFolderHierarchy = GetFolderHierarchy.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();
        expect(loadedFoldersCache.hasItems()).toBeFalse();
        await getFolderHierarchy.useCase.execute({ id: "folder-0" });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ type, id: "folder-0" });

        expect(foldersCache.hasItems()).toBeTrue();
        expect(foldersCache.count()).toEqual(2);
        // We are NOT storing any folder loadedFoldersCache
        expect(loadedFoldersCache.hasItems()).toBeFalse();
    });

    it("should handle gateway errors gracefully", async () => {
        class GetFolderHierarchyErrorMockGateway implements IGetFolderHierarchyGateway {
            async execute(): Promise<GetFolderHierarchyGatewayResponse> {
                throw new Error("Gateway error");
            }
        }

        const gateway = new GetFolderHierarchyErrorMockGateway();
        const spy = vi.spyOn(gateway, "execute");

        const getFolderHierarchy = GetFolderHierarchy.getInstance(type, gateway);

        expect(foldersCache.hasItems()).toBeFalse();

        await expect(getFolderHierarchy.useCase.execute({ id: "folder-0" })).rejects.toThrow(
            "Gateway error"
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();
    });

    it("should clear cache when type changes", async () => {
        const gatewayAbc = new GetFolderHierarchyMockGateway({
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

        const newType = "xyz";
        const gatewayXyz = new GetFolderHierarchyMockGateway({
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
                }
            ],
            siblings: [
                {
                    id: "folder-3",
                    title: "Folder 3",
                    slug: "folder-4",
                    parentId: "folder-2",
                    type
                }
            ]
        });

        const spyAbc = vi.spyOn(gatewayAbc, "execute");
        const spyXzy = vi.spyOn(gatewayXyz, "execute");

        const getFolderHierarchyAbc = GetFolderHierarchy.getInstance(type, gatewayAbc);

        expect(foldersCache.hasItems()).toBeFalse();

        await getFolderHierarchyAbc.useCase.execute({ id: "folder-0" });

        expect(spyAbc).toHaveBeenCalledTimes(1);
        expect(foldersCache.count()).toEqual(5);
        expect(loadedFoldersCache.count()).toEqual(3);

        const foldersCacheXyz = folderCacheFactory.getCache(newType);
        const loadedFoldersCacheXyz = loadedFolderCacheFactory.getCache(newType);
        const getFolderHierarchyXyz = GetFolderHierarchy.getInstance(newType, gatewayXyz);

        expect(foldersCacheXyz.hasItems()).toBeFalse();
        expect(loadedFoldersCacheXyz.hasItems()).toBeFalse();

        await getFolderHierarchyXyz.useCase.execute({ id: "folder-0" });

        expect(spyXzy).toHaveBeenCalledTimes(1);
        expect(foldersCacheXyz.count()).toEqual(3);
        expect(loadedFoldersCacheXyz.count()).toEqual(2);
    });
});
