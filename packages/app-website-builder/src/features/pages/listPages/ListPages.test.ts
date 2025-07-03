import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { ListPages } from "~/features/pages/listPages/ListPages.js";
import { statuses } from "~/constants.js";

describe("ListPages", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            pages: [
                {
                    id: "page-1#0001",
                    entryId: "page-1",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 1"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                },
                {
                    id: "page-2#0001",
                    entryId: "page-2",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 2"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                },
                {
                    id: "page-3#0001",
                    entryId: "page-3",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 3"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                }
            ],
            meta: {
                hasMoreItems: false,
                cursor: null,
                totalCount: 3
            }
        })
    };
    const pagesCache = pageCacheFactory.getCache();

    beforeEach(() => {
        pagesCache.clear();
        jest.clearAllMocks();
    });

    it("should be able to list folders", async () => {
        const listFolders = ListPages.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute({ folderId: "folder-1" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith({
            folderId: "folder-1"
        });
        expect(pagesCache.hasItems()).toBeTrue();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(3);
    });

    it("should return empty array if no folders are found", async () => {
        const emptyGateway = {
            execute: jest.fn().mockResolvedValue({
                pages: [],
                meta: {
                    cursor: null,
                    totalCount: 0,
                    hasMoreItems: false
                }
            })
        };
        const listFolders = ListPages.getInstance(emptyGateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute({
            folderId: "folder-1"
        });

        expect(emptyGateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };
        const listFolders = ListPages.getInstance(errorGateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await expect(
            listFolders.useCase.execute({
                folderId: "folder-1"
            })
        ).rejects.toThrow("Gateway error");

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();
    });

    it("should NOT cache folders after listing", async () => {
        const listFolders = ListPages.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listFolders.useCase.execute({ folderId: "folder-1" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeTrue();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(3);

        // Execute again, it should execute the gateway again
        await listFolders.useCase.execute({ folderId: "folder-1" });
        expect(gateway.execute).toHaveBeenCalledTimes(2);
    });
});
