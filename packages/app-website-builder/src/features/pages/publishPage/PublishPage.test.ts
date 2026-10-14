import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus, type WbStatus } from "~/constants.js";
import { Page, pageListCache, fullPageCache } from "~/domain/Page/index.js";
import { PageRevision, pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import {
    PublishPageUseCase as UseCaseAbstraction,
    PublishPageGateway as GatewayAbstraction
} from "./abstractions.js";
import { PublishPageUseCase } from "./PublishPageUseCase.js";
import { PublishPageRepository } from "./PublishPageRepository.js";
import {
    PageListCache,
    FullPageCache,
    PageRevisionsCache
} from "~/features/pages/shared/abstractions.js";

describe("PublishPage", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
            status: WbPageStatus.Published,
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
                status: WbPageStatus.Draft,
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
        ]);
    });

    it("should be able to publish a page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(PageRevisionsCache, pageRevisionsCacheFactory.getCache());
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageUseCase);

        const publishPage = container.resolve(UseCaseAbstraction);

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
        expect(publishedItem?.status).toEqual(WbPageStatus.Published);

        // Details cache is updated with the full gateway result including document fields
        const detailItem = detailsCache.getItem(page => page.entryId === "page-1");
        expect(detailItem).toBeDefined();
        expect(detailItem?.id).toEqual("page-1#0001");
        expect(detailItem?.status).toEqual(WbPageStatus.Published);
        expect(detailItem?.elements).toMatchObject({ element1: "element" });
        expect(detailItem?.bindings).toMatchObject({ data: "any-data" });
        expect(detailItem?.extensions).toMatchObject({ ext1: "ext-data" });
    });

    it("should not publish a page if id is missing", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(PageRevisionsCache, pageRevisionsCacheFactory.getCache());
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageUseCase);

        const publishPage = container.resolve(UseCaseAbstraction);

        await publishPage.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const publishedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(publishedItem?.id).toEqual("page-1#0001");
        expect(publishedItem?.status).toEqual(WbPageStatus.Draft);
    });

    it("should publish the revision and unpublish the previously published one", async () => {
        const revisionsCache = pageRevisionsCacheFactory.getCache();
        revisionsCache.clear();

        const makeRevision = (id: string, version: number, status: WbStatus) =>
            PageRevision.create({
                id,
                entryId: "page-1",
                version,
                status,
                savedOn: "2026-09-21T00:00:00.000Z",
                title: "Page 1",
                locked: false,
                createdBy: { id: "admin", displayName: "Admin", type: "admin" },
                createdOn: "2026-09-21T00:00:00.000Z",
                revisionDescription: undefined
            });

        revisionsCache.addItems([
            makeRevision("page-1#0001", 1, WbPageStatus.Draft),
            makeRevision("page-1#0002", 2, WbPageStatus.Published)
        ]);

        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageUseCase);

        const publishPage = container.resolve(UseCaseAbstraction);

        await publishPage.execute({ id: "page-1#0001" });

        expect(revisionsCache.getItem(r => r.id === "page-1#0001")?.status).toEqual(
            WbPageStatus.Published
        );
        expect(revisionsCache.getItem(r => r.id === "page-1#0002")?.status).toEqual(
            WbPageStatus.Unpublished
        );
    });
});
