// @ts-nocheck TODO
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { FoldersCache } from "../abstractions.js";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { FoldersContext } from "../abstractions.js";
import { DeleteFolderUseCase } from "./abstractions.js";
import type { IDeleteFolderGateway } from "./abstractions.js";
import { DeleteFolderFeature } from "./feature.js";
import { Folder } from "~/domain/folder/Folder.js";

class DeleteFolderMockGateway implements IDeleteFolderGateway {
    async execute() {}
}

describe("DeleteFolder", () => {
    const type = "abc";
    const gateway = new DeleteFolderMockGateway();

    let container: Container;
    const foldersCache = folderCacheFactory.getCache(type);

    beforeEach(() => {
        container = new Container();
        foldersCache.clear();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);

        DeleteFolderFeature.register(container);

        foldersCache.addItems([
            Folder.create({
                id: "any-folder-id",
                title: "New Folder",
                slug: "new-folder",
                parentId: null,
                permissions: [],
                type
            })
        ]);
    });

    it("should be able to delete a folder", async () => {
        const spy = vi.spyOn(gateway, "execute");
        const deleteFolder = container.resolve(DeleteFolderUseCase);

        expect(foldersCache.hasItems()).toBeTrue();
        const item = foldersCache.getItem(folder => folder.id === "any-folder-id");
        expect(item?.id).toEqual("any-folder-id");

        await deleteFolder.execute("any-folder-id");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(foldersCache.hasItems()).toBeFalse();
    });
});
