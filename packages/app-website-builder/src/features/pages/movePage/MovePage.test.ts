import { MovePage } from "./MovePage.js";
import { statuses } from "~/constants.js";
import { Page, pageCacheFactory } from "~/domains/Page/index.js";

describe("MovePage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue(true)
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

    it("should be able to move a page", async () => {
        const movePage = MovePage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await movePage.execute({
            id: "page-1#0001",
            folderId: "folder-2"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001", "folder-2");

        expect(pagesCache.hasItems()).toBeTrue();
        const movedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(movedItem?.id).toEqual("page-1#0001");
        expect(movedItem?.location?.folderId).toEqual("folder-2");
    });
});
