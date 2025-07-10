import { CreatePageRevisionFrom } from "./CreatePageRevisionFrom.js";
import { statuses } from "~/constants.js";
import { Page, pageCacheFactory } from "~/domain/Page/index.js";

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
                    data: "data-1"
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
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        expect(pagesCache.hasItems()).toBeTrue();
        const newRevision = pagesCache.getItem(page => page.entryId === "page-1");
        expect(newRevision?.id).toEqual("page-1#0002");
        expect(newRevision?.version).toEqual(2);
    });

    it("should not publish a page if id is missing", async () => {
        const createRevisionFrom = CreatePageRevisionFrom.getInstance(gateway);

        await createRevisionFrom.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const newRevision = pagesCache.getItem(page => page.entryId === "page-1");

        expect(newRevision?.id).toEqual("page-1#0001");
        expect(newRevision?.id).toEqual("page-1#0001");
        expect(newRevision?.version).toEqual(1);
    });
});
