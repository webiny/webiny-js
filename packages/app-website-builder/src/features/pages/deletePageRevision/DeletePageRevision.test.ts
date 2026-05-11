import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";
import { metaRepositoryFactory } from "@webiny/app-utils";
import {
    DeletePageRevisionUseCase as UseCaseAbstraction,
    DeletePageRevisionGateway as GatewayAbstraction
} from "./abstractions.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";
import { DeletePageRevisionRepository } from "./DeletePageRevisionRepository.js";
import { PageListCache, WbPageMetaRepository } from "~/features/pages/shared/abstractions.js";

describe("DeletePageRevision", () => {
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

    it("should be able to delete a page revision", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(
            WbPageMetaRepository,
            metaRepositoryFactory.getRepository("WbPageTest")
        );
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(DeletePageRevisionRepository).inSingletonScope();
        container.register(DeletePageRevisionUseCase);

        const deletePage = container.resolve(UseCaseAbstraction);

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
