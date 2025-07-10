import { UpdatePage } from "./UpdatePage.js";
import { statuses } from "~/constants";
import { Page, pageCacheFactory } from "~/domain/Page/index.js";

describe("UpdatePage", () => {
    const pagesCache = pageCacheFactory.getCache();

    beforeEach(() => {
        jest.clearAllMocks();
        pagesCache.clear();
        pagesCache.addItems([
            Page.create({
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
                    data: "metadata-1"
                },
                elements: {
                    element1: "element"
                },
                bindings: {
                    data: "any-data"
                }
            })
        ]);
    });

    it("should be able to update a page", async () => {
        const gateway = {
            execute: jest.fn().mockResolvedValue({
                id: "page-1#0001",
                entryId: "page-1",
                status: statuses.draft,
                wbyAco_location: {
                    folderId: "folder-1"
                },
                properties: {
                    title: "Page 1 - Updated"
                },
                metadata: {
                    data: "metadata-1-updated"
                },
                elements: {
                    element1: "element-updated"
                },
                bindings: {
                    data: "any-data-updated"
                }
            })
        };

        const updatePage = UpdatePage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.entryId === "page-1");

        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
        expect(item?.properties).toMatchObject({
            title: "Page 1"
        });
        expect(item?.elements).toMatchObject({
            element1: "element"
        });
        expect(item?.metadata).toMatchObject({
            data: "metadata-1"
        });
        expect(item?.bindings).toMatchObject({
            data: "any-data"
        });

        await updatePage.execute({
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        const updatedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(updatedItem).toBeDefined();
        expect(updatedItem?.id).toEqual("page-1#0001");
        expect(updatedItem?.entryId).toEqual("page-1");
        expect(updatedItem?.properties).toMatchObject({
            title: "Page 1 - Updated"
        });
        expect(updatedItem?.elements).toMatchObject({
            element1: "element-updated"
        });
        expect(updatedItem?.metadata).toMatchObject({
            data: "metadata-1-updated"
        });
        expect(updatedItem?.bindings).toMatchObject({
            data: "any-data-updated"
        });
    });

    it("should not update a page if id is missing", async () => {
        const gateway = {
            execute: jest.fn().mockResolvedValue(null)
        };

        const updatePage = UpdatePage.getInstance(gateway);

        await updatePage.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        const updatedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(updatedItem).toBeDefined();
        expect(updatedItem?.id).toEqual("page-1#0001");
        expect(updatedItem?.entryId).toEqual("page-1");
        expect(updatedItem?.properties).toMatchObject({
            title: "Page 1"
        });
        expect(updatedItem?.elements).toMatchObject({
            element1: "element"
        });
        expect(updatedItem?.metadata).toMatchObject({
            data: "metadata-1"
        });
        expect(updatedItem?.bindings).toMatchObject({
            data: "any-data"
        });
    });

    it("should handle gateway errors gracefully", async () => {
        const gateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };

        const updatePage = UpdatePage.getInstance(gateway);

        await expect(
            updatePage.execute({
                id: "page-1#0001"
            })
        ).rejects.toThrow("Gateway error");

        expect(gateway.execute).toHaveBeenCalledTimes(1);
    });
});
