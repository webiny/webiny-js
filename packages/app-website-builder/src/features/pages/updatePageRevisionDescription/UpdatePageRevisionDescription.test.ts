import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache, fullPageCache } from "~/domain/Page/index.js";
import {
    UpdatePageRevisionDescriptionUseCase as UseCaseAbstraction,
    UpdatePageRevisionDescriptionGateway as GatewayAbstraction
} from "./abstractions.js";
import { UpdatePageRevisionDescriptionUseCase } from "./UpdatePageRevisionDescriptionUseCase.js";
import { UpdatePageRevisionDescriptionRepository } from "./UpdatePageRevisionDescriptionRepository.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

describe("UpdatePageRevisionDescription", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
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
                },
                revisionDescription: undefined
            })
        ]);
    });

    it("should be able to publish a page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UpdatePageRevisionDescriptionRepository).inSingletonScope();
        container.register(UpdatePageRevisionDescriptionUseCase);

        const updatePageRevisionDescription = container.resolve(UseCaseAbstraction);

        expect(pagesCache.hasItems()).toBeTrue();
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await updatePageRevisionDescription.execute({
            id: "page-1#0001",
            revisionDescription: "A revision description"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001", "A revision description");

        expect(pagesCache.hasItems()).toBeTrue();
        const updatedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(updatedItem?.id).toEqual("page-1#0001");
        expect(updatedItem?.status).toEqual(WbPageStatus.Draft);
    });

    it("should not publish a page if id is missing", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(UpdatePageRevisionDescriptionRepository).inSingletonScope();
        container.register(UpdatePageRevisionDescriptionUseCase);

        const updatePageRevisionDescription = container.resolve(UseCaseAbstraction);

        await updatePageRevisionDescription.execute({
            id: "",
            revisionDescription: "A revision description"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);

        const updatedItem = pagesCache.getItem(page => page.entryId === "page-1");

        expect(updatedItem?.id).toEqual("page-1#0001");
        expect(updatedItem?.revisionDescription).toBeUndefined();
        expect(updatedItem?.status).toEqual(WbPageStatus.Draft);
    });
});
