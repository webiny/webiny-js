import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { pageListCache } from "~/domain/Page/index.js";
import {
    CreatePageUseCase as UseCaseAbstraction,
    CreatePageGateway as GatewayAbstraction
} from "./abstractions.js";
import { CreatePageUseCase } from "./CreatePageUseCase.js";
import { CreatePageRepository } from "./CreatePageRepository.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

describe("CreatePage", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue({
            id: "page-1#0001",
            entryId: "page-1",
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
    const pageCache = pageListCache;

    beforeEach(() => {
        pageCache.clear();
    });

    it("should be able to create a new page", async () => {
        const container = new Container();
        container.registerInstance(PageListCache, pageCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(CreatePageRepository).inSingletonScope();
        container.register(CreatePageUseCase);

        const createPage = container.resolve(UseCaseAbstraction);

        expect(pageCache.hasItems()).toBeFalse();

        await createPage.execute({
            location: {
                folderId: "folder-1"
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(pageCache.hasItems()).toBeTrue();

        const item = pageCache.getItem(page => page.entryId === "page-1");

        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
        expect(item?.location).toEqual({
            folderId: "folder-1"
        });
        expect(item?.properties).toEqual({
            title: "Page 1"
        });
        expect(item?.metadata).toEqual({
            data: "data-1"
        });
        expect(item?.elements).toEqual({
            element1: "element"
        });
        expect(item?.bindings).toEqual({
            data: "any-data"
        });
    });
});
