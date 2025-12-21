import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnpublishPage } from "./UnpublishPage.js";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";

describe("UnpublishPage", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: WbPageStatus.Unpublished,
            location: {
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

    const pagesCache = pageListCache;

    beforeEach(() => {
        vi.clearAllMocks();
        pagesCache.clear();
        pagesCache.addItems([
            Page.create({
                id: "page-1#0001",
                entryId: "page-1",
                status: WbPageStatus.Published,
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
            })
        ]);
    });

    it("should be able to unpublish a page", async () => {
        const publishPage = UnpublishPage.getInstance(gateway);

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
        expect(publishedItem?.status).toEqual(WbPageStatus.Unpublished);
    });

    it("should not unpublish a page if id is missing", async () => {
        const publishPage = UnpublishPage.getInstance(gateway);

        await publishPage.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(WbPageStatus.Published);
    });
});
