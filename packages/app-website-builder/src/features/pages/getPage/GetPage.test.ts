import { GetPage } from "~/features/pages/getPage/GetPage.js";
import { WbPageStatus } from "~/constants.js";
import { fullPageCache } from "~/domain/Page/index.js";

describe("GetPage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: WbPageStatus.Draft,
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

    beforeEach(() => {
        fullPageCache.clear();
        jest.clearAllMocks();
    });

    it("should be able to get a page", async () => {
        const getPage = GetPage.getInstance(gateway);

        expect(fullPageCache.hasItems()).toBeFalse();

        await getPage.useCase.execute({ id: "page-1#0001" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        const items = fullPageCache.getItems();
        expect(items.length).toEqual(1);

        const item = fullPageCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should be able to get a page more than once (returned from cache)", async () => {
        const getPage = GetPage.getInstance(gateway);

        expect(fullPageCache.hasItems()).toBeFalse();

        // execute the first time
        await getPage.useCase.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        // execute the second time
        await getPage.useCase.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        const items = fullPageCache.getItems();
        expect(items.length).toEqual(1);

        const item = fullPageCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };
        const getPage = GetPage.getInstance(errorGateway);

        expect(fullPageCache.hasItems()).toBeFalse();

        await expect(getPage.useCase.execute({ id: "page-1#0001" })).rejects.toThrow(
            "Gateway error"
        );

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(fullPageCache.hasItems()).toBeFalse();
    });
});
