import { CreatePage } from "~/features/pages/createPage/CreatePage.js";
import { pageCacheFactory } from "~/domains/Page/index.js";

describe("CreatePage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
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
    const pageCache = pageCacheFactory.getCache();

    beforeEach(() => {
        pageCache.clear();
    });

    it("should be able to create a new page", async () => {
        const createPage = CreatePage.getInstance(gateway);

        expect(pageCache.hasItems()).toBeFalse();

        await createPage.execute({
            location: {
                folderId: "folder-1"
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(pageCache.hasItems()).toBeTrue();

        const item = pageCache.getItem(page => page.entryId === "page-1");

        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
        expect(item?.location).toEqual({
            folderId: "folder-1"
        });
        expect(item?.properties).toEqual({
            title: "Page 1"
        });
        expect(item?.metadata).toEqual({
            data: "data-1"
        });
        expect(item?.elements).toEqual({
            element1: "element"
        });
        expect(item?.bindings).toEqual({
            data: "any-data"
        });
    });
});
