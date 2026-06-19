import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache, fullPageCache } from "~/domain/Page/index.js";
import {
    UnpublishPageUseCase as UseCaseAbstraction,
    UnpublishPageGateway as GatewayAbstraction
} from "./abstractions.js";
import { UnpublishPageUseCase } from "./UnpublishPageUseCase.js";
import { UnpublishPageRepository } from "./UnpublishPageRepository.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

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
            },
            extensions: {
                ext1: "ext-data"
            }
        })
    };

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
        detailsCache.addItems([
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
                },
                extensions: {
                    ext1: "ext-data"
                }
            })
        ]);
    });

    it("should be able to unpublish a page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, detailsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UnpublishPageRepository).inSingletonScope();
        container.register(UnpublishPageUseCase);

        const unpublishPage = container.resolve(UseCaseAbstraction);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await unpublishPage.execute({
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");

        expect(pagesCache.hasItems()).toBeTrue();
        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(WbPageStatus.Unpublished);

        // Details cache is updated with the full gateway result including document fields
        const detailItem = detailsCache.getItem(page => page.entryId === "page-1");
        expect(detailItem).toBeDefined();
        expect(detailItem?.id).toEqual("page-1#0001");
        expect(detailItem?.status).toEqual(WbPageStatus.Unpublished);
        expect(detailItem?.elements).toMatchObject({ element1: "element" });
        expect(detailItem?.bindings).toMatchObject({ data: "any-data" });
        expect(detailItem?.extensions).toMatchObject({ ext1: "ext-data" });
    });

    it("should not unpublish a page if id is missing", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, detailsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UnpublishPageRepository).inSingletonScope();
        container.register(UnpublishPageUseCase);

        const unpublishPage = container.resolve(UseCaseAbstraction);

        await unpublishPage.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(WbPageStatus.Published);
    });
});
