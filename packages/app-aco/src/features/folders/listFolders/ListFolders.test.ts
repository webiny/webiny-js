import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { ListFoldersGateway } from "./abstractions.js";
import { Container } from "@webiny/di";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ListFoldersFeature } from "~/features/folders/listFolders/feature.js";
import { ListFoldersUseCase } from "./abstractions.js";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { LoadingRepository } from "@webiny/app-utils";

const type = "abc";

class ListFoldersMockGateway implements ListFoldersGateway.Interface {
    async execute() {
        return [
            {
                id: "folder-1",
                title: "Folder 1",
                slug: "folder-1",
                type
            },
            {
                id: "folder-2",
                title: "Folder 2",
                slug: "folder-1",
                type
            },
            {
                id: "folder-3",
                title: "Folder 3",
                slug: "folder-3",
                type
            }
        ] as FolderDto[];
    }
}

describe("ListFolders", () => {
    function setupTest(gateway: ListFoldersGateway.Interface) {
        const container = new Container();
        const foldersCache = new ListCache<Folder>();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);
        container.registerInstance(FoldersLoadingRepository, new LoadingRepository());

        ListFoldersFeature.register(container);
        container.registerInstance(ListFoldersGateway, gateway);

        return { container, foldersCache, useCase: container.resolve(ListFoldersUseCase) };
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should be able to list folders", async () => {
        const gateway = new ListFoldersMockGateway();
        const { useCase, foldersCache } = setupTest(gateway);

        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBe(false);

        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(true);

        const items = foldersCache.getItems();
        expect(items.length).toEqual(3);
    });

    it("should return empty array if no folders are found", async () => {
        class ListFoldersEmptyMockGateway implements ListFoldersGateway.Interface {
            async execute() {
                return [];
            }
        }

        const emptyGateway = new ListFoldersEmptyMockGateway();
        const { useCase, foldersCache } = setupTest(emptyGateway);
        const spy = vi.spyOn(emptyGateway, "execute");

        expect(foldersCache.hasItems()).toBe(false);

        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(false);

        const items = foldersCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        class ListFoldersErrorMockGateway implements ListFoldersGateway.Interface {
            async execute(): Promise<FolderDto[]> {
                throw new Error("Gateway error");
            }
        }

        const errorGateway = new ListFoldersErrorMockGateway();
        const { useCase, foldersCache } = setupTest(errorGateway);
        const spy = vi.spyOn(errorGateway, "execute");

        expect(foldersCache.hasItems()).toBe(false);

        await expect(useCase.execute()).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(false);
    });

    it("should NOT cache folders after listing", async () => {
        const gateway = new ListFoldersMockGateway();
        const { useCase, foldersCache } = setupTest(gateway);
        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBe(false);

        await useCase.execute();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(true);

        const items = foldersCache.getItems();
        expect(items.length).toEqual(3);

        // Execute again, it should execute the gateway again
        await useCase.execute();
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
