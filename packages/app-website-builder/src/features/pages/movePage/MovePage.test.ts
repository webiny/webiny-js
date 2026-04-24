import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";
import {
    MovePageUseCase as UseCaseAbstraction,
    MovePageGateway as GatewayAbstraction
} from "./abstractions.js";
import { MovePageUseCase } from "./MovePageUseCase.js";
import { MovePageRepository } from "./MovePageRepository.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

describe("MovePage", () => {
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
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(MovePageRepository).inSingletonScope();
        container.register(MovePageUseCase);

        const movePage = container.resolve(UseCaseAbstraction);

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
