import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { FoldersCache } from "../abstractions.js";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { FoldersContext } from "../abstractions.js";
import type { FolderGatewayOutputDto } from "./abstractions.js";
import { CreateFolderUseCase } from "./abstractions.js";
import type { ICreateFolderGateway } from "./abstractions.js";
import { CreateFolderFeature } from "./feature.js";

class CreateFolderMockGateway implements ICreateFolderGateway {
    async execute() {
        return {
            id: "any-folder-id",
            title: "New Folder",
            slug: "new-folder",
            type: "abc"
        } as FolderGatewayOutputDto; // We don't care about the rest of the props, hence the type assertion.
    }
}

describe("CreateFolder", () => {
    const type = "abc";
    const gateway = new CreateFolderMockGateway();

    let container: Container;
    const foldersCache = folderCacheFactory.getCache(type);

    beforeEach(() => {
        container = new Container();
        foldersCache.clear();

        container.registerInstance(FoldersContext, { type, modelFields: "" });
        container.registerInstance(FoldersCache, foldersCache);

        CreateFolderFeature.register(container);
    });

    it("should be able to create a new folder", async () => {
        const spy = vi.spyOn(gateway, "execute");
        const createFolder = container.resolve(CreateFolderUseCase);

        expect(foldersCache.hasItems()).toBeFalse();

        await createFolder.execute({
            title: "New Folder",
            slug: "new-folder",
            parentId: null,
            permissions: [],
            type
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeTrue();

        const item = foldersCache.getItem(folder => folder.slug === "new-folder");

        expect(item).toBeDefined();
        expect(item?.id).toEqual("any-folder-id");
        expect(item?.type).toEqual(type);
        expect(item?.title).toEqual("New Folder");
        expect(item?.slug).toEqual("new-folder");
    });
});
