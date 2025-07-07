import { UnpublishPage } from "./UnpublishPage.js";
import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { statuses } from "~/constants.js";
import { Page } from "~/features/pages/Page.js";

describe("UnpublishPage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: statuses.unpublished,
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
        })
    };

    const pagesCache = pageCacheFactory.getCache();

    beforeEach(() => {
        pagesCache.clear();
        pagesCache.addItems([
            Page.create({
                id: "page-1#0001",
                entryId: "page-1",
                status: statuses.published,
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
            })
        ]);
    });

    it("should be able to unpublish a page", async () => {
        const publishPage = UnpublishPage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await publishPage.execute({
            id: "page-1#0001",
            entryId: "page-1"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");

        expect(pagesCache.hasItems()).toBeTrue();
        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(statuses.unpublished);
    });

    it("should not unpublish a page if id is missing", async () => {
        const publishPage = UnpublishPage.getInstance(gateway);

        await publishPage.execute({
            id: "",
            entryId: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(statuses.published);
    });
});
