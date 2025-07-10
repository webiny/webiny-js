import { PublishPage } from "./PublishPage.js";
import { statuses } from "~/constants.js";
import { Page, pageCacheFactory } from "~/domain/Page/index.js";

describe("PublishPage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: statuses.published,
            wbyAco_location: {
                folderId: "folder-1"
            },
            properties: {
                title: "Page 1"
            },
            metadata: {
                metadata: "data-1"
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
                    metadata: "data-1"
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

    it("should be able to publish a page", async () => {
        const publishPage = PublishPage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await publishPage.execute({
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");

        expect(pagesCache.hasItems()).toBeTrue();
        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(statuses.published);
    });

    it("should not publish a page if id is missing", async () => {
        const publishPage = PublishPage.getInstance(gateway);

        await publishPage.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(statuses.draft);
    });
});
