import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page, pageListCache } from "~/domain/Page/index.js";
import { metaRepositoryFactory } from "@webiny/app-utils";
import {
    DuplicatePageUseCase as UseCaseAbstraction,
    DuplicatePageGateway as GatewayAbstraction
} from "./abstractions.js";
import { DuplicatePageUseCase } from "./DuplicatePageUseCase.js";
import { DuplicatePageRepository } from "./DuplicatePageRepository.js";
import { PageListCache, WbPageMetaRepository } from "~/features/pages/shared/abstractions.js";

describe("DuplicatePage", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
            id: "page-1-duplicated#0001",
            entryId: "page-1-duplicated",
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

    it("should be able to duplicate a page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pagesCache);
        container.registerInstance(
            WbPageMetaRepository,
            metaRepositoryFactory.getRepository("WbPageTest")
        );
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(DuplicatePageRepository).inSingletonScope();
        container.register(DuplicatePageUseCase);

        const duplicatePage = container.resolve(UseCaseAbstraction);

        expect(pagesCache.hasItems()).toBeTrue();
        expect(pagesCache.count()).toBe(1);
        const item = pagesCache.getItem(page => page.id === "page-1#0001");
        expect(item?.id).toEqual("page-1#0001");

        await duplicatePage.execute({
            id: "page-1#0001"
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");

        expect(pagesCache.hasItems()).toBeTrue();
        expect(pagesCache.count()).toBe(2);

        const duplicatedItem = pagesCache.getItem(page => page.entryId === "page-1-duplicated");

        expect(duplicatedItem).toBeDefined();
        expect(duplicatedItem?.id).toEqual("page-1-duplicated#0001");
        expect(duplicatedItem?.entryId).toEqual("page-1-duplicated");
        expect(duplicatedItem?.location).toEqual({
            folderId: "folder-1"
        });
        expect(duplicatedItem?.properties).toEqual({
            title: "Page 1"
        });
        expect(duplicatedItem?.elements).toEqual({
            element1: "element"
        });
        expect(duplicatedItem?.bindings).toEqual({
            data: "any-data"
        });
    });
});
