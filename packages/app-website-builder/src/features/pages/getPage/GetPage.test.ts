import { GetPage } from "~/features/pages/getPage/GetPage.js";
import { statuses } from "~/constants.js";
import { pageCacheFactory } from "~/domains/Page/index.js";

describe("GetPage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: statuses.draft,
            wbyAco_location: {
                folderId: "folder-1"
            },
            properties: {
                title: "Page 1"
            },
            metadata: {
                data: "data-1"
            },
            elements: {
                element1: "element"
            },
            bindings: {
                data: "any-data"
            }
        })
    };
    const pagesCache = pageCacheFactory.getCache();

    beforeEach(() => {
        pagesCache.clear();
        jest.clearAllMocks();
    });

    it("should be able to get a page", async () => {
        const getPage = GetPage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await getPage.useCase.execute({ id: "page-1#0001" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(pagesCache.hasItems()).toBeTrue();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(1);

        const item = pagesCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should be able to get a page more than once", async () => {
        const getPage = GetPage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        // execute the first time
        await getPage.useCase.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(pagesCache.hasItems()).toBeTrue();

        // execute the second time
        await getPage.useCase.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(2);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(pagesCache.hasItems()).toBeTrue();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(1);

        const item = pagesCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };
        const getPage = GetPage.getInstance(errorGateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await expect(getPage.useCase.execute({ id: "page-1#0001" })).rejects.toThrow(
            "Gateway error"
        );

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();
    });
});
