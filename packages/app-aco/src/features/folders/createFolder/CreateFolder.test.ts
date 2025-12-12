import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { FoldersCache } from "../abstractions.js";
import { FoldersContext } from "../abstractions.js";
import { CreateFolderUseCase } from "./abstractions.js";
import { CreateFolderFeature } from "./feature.js";
import { CreateFolderGateway } from "./abstractions.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";

class CreateFolderMockGateway implements CreateFolderGateway.Interface {
    async execute() {
        return {
            id: "any-folder-id",
            title: "New Folder",
            slug: "new-folder",
            type: "abc"
        } as FolderDto;
    }
}

describe("CreateFolder", () => {
    const type = "abc";
    const gateway = new CreateFolderMockGateway();

    let container: Container;
    const foldersCache = new ListCache<Folder>();

    beforeEach(() => {
        container = new Container();
        foldersCache.clear();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);

        CreateFolderFeature.register(container);

        // Replace the feature gateway with a mock
        container.registerInstance(CreateFolderGateway, gateway);
    });

    it("should be able to create a new folder", async () => {
        const spy = vi.spyOn(gateway, "execute");
        const createFolder = container.resolve(CreateFolderUseCase);

        expect(foldersCache.hasItems()).toBe(false);

        await createFolder.execute({
            title: "New Folder",
            slug: "new-folder",
            parentId: null,
            permissions: [],
            type
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBe(true);

        const item = foldersCache.getItem(folder => folder.slug === "new-folder");

        expect(item).toBeDefined();
        expect(item?.id).toEqual("any-folder-id");
        expect(item?.type).toEqual(type);
        expect(item?.title).toEqual("New Folder");
        expect(item?.slug).toEqual("new-folder");
    });
});
