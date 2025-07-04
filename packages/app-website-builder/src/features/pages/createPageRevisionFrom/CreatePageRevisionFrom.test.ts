import { CreatePageRevisionFrom } from "./CreatePageRevisionFrom.js";
import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { statuses } from "~/constants.js";
import { Page } from "~/features/pages/Page.js";

describe("CreatePageRevisionFrom", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1#0002",
            entryId: "page-1",
            status: statuses.draft,
            version: 2,
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
            })
        ]);
    });

    it("should be able to create a page revision from another revision", async () => {
        const createPageRevisionFrom = CreatePageRevisionFrom.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await createPageRevisionFrom.execute({
            id: "page-1#0001",
            entryId: "page-1",
            status: statuses.draft,
            location: {
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
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        expect(pagesCache.hasItems()).toBeTrue();
        const newRevision = pagesCache.getItem(page => page.entryId === "page-1");
        expect(newRevision?.id).toEqual("page-1#0002");
        expect(newRevision?.version).toEqual(2);
    });

    it("should not publish a page if id is missing", async () => {
        const publishPage = CreatePageRevisionFrom.getInstance(gateway);

        await publishPage.execute({
            id: "",
            entryId: "",
            status: statuses.draft,
            location: {
                folderId: "folder-1"
            },
            properties: {
                title: "Page 1 - Updated"
            },
            elements: {
                element1: "element-updated"
            },
            bindings: {
                data: "any-data-updated"
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(statuses.draft);
    });
});
