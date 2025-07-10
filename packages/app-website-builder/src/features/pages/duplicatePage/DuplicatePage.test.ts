import { DuplicatePage } from "./DuplicatePage.js";
import { statuses } from "~/constants.js";
import { Page, pageCacheFactory } from "~/domain/Page/index.js";

describe("DuplicatePage", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            id: "page-1-duplicated#0001",
            entryId: "page-1-duplicated",
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

    it("should be able to duplicate a page", async () => {
        const duplicatePage = DuplicatePage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        expect(pagesCache.count()).toBe(1);
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await duplicatePage.execute({
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");

        expect(pagesCache.hasItems()).toBeTrue();
        expect(pagesCache.count()).toBe(2);

        const duplicatedItem = pagesCache.getItem(page => page.entryId === "page-1-duplicated");

        expect(duplicatedItem).toBeDefined();
        expect(duplicatedItem?.id).toEqual("page-1-duplicated#0001");
        expect(duplicatedItem?.entryId).toEqual("page-1-duplicated");
        expect(duplicatedItem?.location).toEqual({
            folderId: "folder-1"
        });
        expect(duplicatedItem?.properties).toEqual({
            title: "Page 1"
        });
        expect(duplicatedItem?.elements).toEqual({
            element1: "element"
        });
        expect(duplicatedItem?.bindings).toEqual({
            data: "any-data"
        });
    });
});
