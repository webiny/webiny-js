import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";
import { PageRevision, pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import {
    CreatePageRevisionFromUseCase as UseCaseAbstraction,
    CreatePageRevisionFromGateway as GatewayAbstraction
} from "./abstractions.js";
import { CreatePageRevisionFromUseCase } from "./CreatePageRevisionFromUseCase.js";
import { CreatePageRevisionFromRepository } from "./CreatePageRevisionFromRepository.js";
import { PageListCache, PageRevisionsCache } from "~/features/pages/shared/abstractions.js";

describe("CreatePageRevisionFrom", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
            id: "page-1#0002",
            entryId: "page-1",
            status: WbPageStatus.Draft,
            version: 2,
            location: {
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

    const pagesCache = pageListCache;
    const revisionsCache = pageRevisionsCacheFactory.getCache();

    beforeEach(() => {
        vi.clearAllMocks();
        pagesCache.clear();
        revisionsCache.clear();
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
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(CreatePageRevisionFromRepository).inSingletonScope();
        container.register(CreatePageRevisionFromUseCase);

        const createPageRevisionFrom = container.resolve(UseCaseAbstraction);

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
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(CreatePageRevisionFromRepository).inSingletonScope();
        container.register(CreatePageRevisionFromUseCase);

        const createRevisionFrom = container.resolve(UseCaseAbstraction);

        await createRevisionFrom.execute({
            id: ""
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const newRevision = pagesCache.getItem(page => page.entryId === "page-1");

        expect(newRevision?.id).toEqual("page-1#0001");
        expect(newRevision?.id).toEqual("page-1#0001");
        expect(newRevision?.version).toEqual(1);
    });

    it("should add the new revision to the revisions cache", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(CreatePageRevisionFromRepository).inSingletonScope();
        container.register(CreatePageRevisionFromUseCase);

        const createPageRevisionFrom = container.resolve(UseCaseAbstraction);

        revisionsCache.addItems([
            PageRevision.create({
                id: "page-1#0001",
                entryId: "page-1",
                status: WbPageStatus.Draft,
                version: 1,
                savedOn: "2026-09-21T00:00:00.000Z",
                title: "Page 1",
                locked: false,
                createdBy: { id: "admin", displayName: "Admin", type: "admin" },
                createdOn: "2026-09-21T00:00:00.000Z",
                revisionDescription: undefined
            })
        ]);

        await createPageRevisionFrom.execute({
            id: "page-1#0001"
        });

        // The source revision must be kept: the revisions list shows every revision.
        expect(revisionsCache.count()).toEqual(2);

        const newRevision = revisionsCache.getItem(revision => revision.id === "page-1#0002");
        expect(newRevision?.version).toEqual(2);
        expect(newRevision?.entryId).toEqual("page-1");
        expect(newRevision?.title).toEqual("Page 1");
    });
});
