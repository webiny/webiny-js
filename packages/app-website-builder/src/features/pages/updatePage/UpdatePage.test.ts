import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache, fullPageCache } from "~/domain/Page/index.js";
import {
    UpdatePageUseCase as UseCaseAbstraction,
    UpdatePageGateway as GatewayAbstraction
} from "./abstractions.js";
import { UpdatePageUseCase } from "./UpdatePageUseCase.js";
import { UpdatePageRepository } from "./UpdatePageRepository.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

describe("UpdatePage", () => {
    const pagesCache = pageListCache;
    const detailsCache = fullPageCache;

    beforeEach(() => {
        vi.clearAllMocks();
        pagesCache.clear();
        detailsCache.clear();
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
        detailsCache.addItems([
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
            execute: vi.fn().mockResolvedValue({
                id: "page-1#0001",
                entryId: "page-1",
                status: WbPageStatus.Draft,
                location: {
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

        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, detailsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UpdatePageRepository).inSingletonScope();
        container.register(UpdatePageUseCase);

        const updatePage = container.resolve(UseCaseAbstraction);

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

        // List cache gets full replacement from gateway result
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

        // Details cache preserves elements and bindings from the DTO (sent data)
        const detailItem = detailsCache.getItem(page => page.entryId === "page-1");
        expect(detailItem).toBeDefined();
        expect(detailItem?.id).toEqual("page-1#0001");
        expect(detailItem?.properties).toMatchObject({
            title: "Page 1 - Updated"
        });
        expect(detailItem?.metadata).toMatchObject({
            data: "metadata-1-updated"
        });
        // elements and bindings come from the DTO (sent data), not the gateway result
        expect(detailItem?.elements).toMatchObject({});
        expect(detailItem?.bindings).toMatchObject({});
    });

    it("should not update a page if id is missing", async () => {
        const gateway = {
            execute: vi.fn().mockResolvedValue(null)
        };

        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, detailsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UpdatePageRepository).inSingletonScope();
        container.register(UpdatePageUseCase);

        const updatePage = container.resolve(UseCaseAbstraction);

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
            execute: vi.fn().mockRejectedValue(new Error("Gateway error"))
        };

        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, detailsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UpdatePageRepository).inSingletonScope();
        container.register(UpdatePageUseCase);

        const updatePage = container.resolve(UseCaseAbstraction);

        await expect(
            updatePage.execute({
                id: "page-1#0001"
            })
        ).rejects.toThrow("Gateway error");

        expect(gateway.execute).toHaveBeenCalledTimes(1);
    });
});
