import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { fullPageCache } from "~/domain/Page/index.js";
import {
    GetPageUseCase as UseCaseAbstraction,
    GetPageGateway as GatewayAbstraction
} from "./abstractions.js";
import { GetPageUseCase } from "./GetPageUseCase.js";
import { GetPageRepository } from "./GetPageRepository.js";
import { FullPageCache } from "~/features/pages/shared/abstractions.js";

describe("GetPage", () => {
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

    beforeEach(() => {
        fullPageCache.clear();
        vi.clearAllMocks();
    });

    it("should be able to get a page", async () => {
        const container = new Container();
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(GetPageRepository).inSingletonScope();
        container.register(GetPageUseCase);

        const getPage = container.resolve(UseCaseAbstraction);

        expect(fullPageCache.hasItems()).toBeFalse();

        await getPage.execute({ id: "page-1#0001" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        const items = fullPageCache.getItems();
        expect(items.length).toEqual(1);

        const item = fullPageCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should be able to get a page more than once (returned from cache)", async () => {
        const container = new Container();
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(GetPageRepository).inSingletonScope();
        container.register(GetPageUseCase);

        const getPage = container.resolve(UseCaseAbstraction);

        expect(fullPageCache.hasItems()).toBeFalse();

        // execute the first time
        await getPage.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        // execute the second time
        await getPage.execute({ id: "page-1#0001" });
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith("page-1#0001");
        expect(fullPageCache.hasItems()).toBeTrue();

        const items = fullPageCache.getItems();
        expect(items.length).toEqual(1);

        const item = fullPageCache.getItem(p => p.entryId === "page-1");
        expect(item).toBeDefined();
        expect(item?.id).toEqual("page-1#0001");
        expect(item?.entryId).toEqual("page-1");
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: vi.fn().mockRejectedValue(new Error("Gateway error"))
        };

        const container = new Container();
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(GatewayAbstraction, errorGateway);
        container.register(GetPageRepository).inSingletonScope();
        container.register(GetPageUseCase);

        const getPage = container.resolve(UseCaseAbstraction);

        expect(fullPageCache.hasItems()).toBeFalse();

        await expect(getPage.execute({ id: "page-1#0001" })).rejects.toThrow("Gateway error");

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(fullPageCache.hasItems()).toBeFalse();
    });
});
