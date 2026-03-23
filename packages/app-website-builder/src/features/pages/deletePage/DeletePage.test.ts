import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeletePage } from "./DeletePage.js";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";

describe("DeletePage", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue(true)
    };
    const pagesCache = pageListCache;

    beforeEach(() => {
        pagesCache.clear();
        pagesCache.addItems([
            Page.create({
                id: "page-1#0001",
                entryId: "page-1",
                status: WbPageStatus.Draft,
                location: {
                    folderId: "folder-1"
                },
                properties: {
                    title: "Page 1"
                },
                metadata: {
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

    it("should be able to delete a page", async () => {
        const deletePage = DeletePage.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await deletePage.execute({
            id: "page-1#0001",
            permanently: true
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();
    });
});
