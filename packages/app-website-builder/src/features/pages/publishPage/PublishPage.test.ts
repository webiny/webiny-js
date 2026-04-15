import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache, fullPageCache } from "~/domain/Page/index.js";
import {
    PublishPageUseCase as UseCaseAbstraction,
    PublishPageGateway as GatewayAbstraction
} from "./abstractions.js";
import { PublishPageUseCase } from "./PublishPageUseCase.js";
import { PublishPageRepository } from "./PublishPageRepository.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

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
    });

    it("should be able to publish a page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
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
    });

    it("should not publish a page if id is missing", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
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
});
