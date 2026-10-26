import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeReviewContentAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { MODEL } from "~/testing/models.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";

interface FontAwesomeElementProps {
    icon: string[];
}

interface RenderedIconProps {
    label: string;
    icon: React.ReactElement<FontAwesomeElementProps>;
}

const createModel = (modelId: string, name: string, icon: string): CmsModel => {
    return { ...MODEL, modelId, name, icon };
};

const contentAdapter = createFakeContentAdapter();

const createAdapter = (models: CmsModel[], folders: FolderDto[] = []) => {
    const cache = new ListCache<CmsModel>("modelId");
    // Mirrors `ListModelsRepository`: the first call fills the cache, later calls serve it.
    const execute = vi.fn(async () => {
        if (!cache.hasItems()) {
            cache.setItems(models);
        }
        return cache.getItems();
    });
    const container = new Container();
    container.registerInstance(ModelsCache, cache);
    container.registerInstance(ListModelsUseCase, { execute });
    // Mirrors the gateway of app-aco: the virtual root row comes first.
    const rootFolder = RootFolder.create();
    const listFoldersExecute = vi
        .fn<ListFoldersGateway.Interface["execute"]>()
        .mockResolvedValue([rootFolder, ...folders]);
    container.registerInstance(ListFoldersGateway, { execute: listFoldersExecute });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.register(CmsWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, execute, listFoldersExecute };
};

describe("CmsWorkflowEditorAppAdapter", () => {
    it("describes the CMS app", () => {
        const { adapter } = createAdapter([]);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.panelLabel).toBe("Content models");
        expect(adapter.appliesToLabel).toBe("Headless CMS model");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("lists the models on init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);

        await adapter.init();

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("does not reject when the models cannot be listed, renders no icon and retries on the next init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);
        execute.mockRejectedValueOnce(new Error("Not authorized."));

        await expect(adapter.init()).resolves.toBeUndefined();
        const before = adapter.renderModelIcon("article");
        await adapter.init();
        const after = adapter.renderModelIcon("article");

        expect(before).toBeNull();
        expect(after).not.toBeNull();
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("renders the model icon from the cached model", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter } = createAdapter([model]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Article");
        expect(node.props.icon.props.icon).toEqual(["fas", "newspaper"]);
    });

    it("renders nothing for a model that is not cached", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "fas/newspaper")]);
        await adapter.init();

        const node = adapter.renderModelIcon("missing");

        expect(node).toBeNull();
    });

    it("renders nothing for a model without an icon", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "")]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        expect(node).toBeNull();
    });

    describe("folders (R292)", () => {
        it("names the folder type of a model cms:<modelId>", () => {
            const { adapter } = createAdapter([]);

            expect(adapter.getFolderType("article")).toBe("cms:article");
            expect(adapter.getFolderType("author")).toBe("cms:author");
        });

        it("lists the folders with the type of the model, root excluded, and the title paths", async () => {
            const { adapter, listFoldersExecute } = createAdapter(
                [],
                [
                    createFolder("folder-a", "Campaigns", ROOT_FOLDER),
                    createFolder("folder-b", "Spring", "folder-a"),
                    createFolder("folder-c", "Press", ROOT_FOLDER)
                ]
            );

            const folders = await adapter.listFolders("article");

            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
            expect(listFoldersExecute).toHaveBeenCalledWith("cms:article");
            expect(folders).toEqual([
                { id: "folder-a", path: "/Campaigns" },
                { id: "folder-b", path: "/Campaigns/Spring" },
                { id: "folder-c", path: "/Press" }
            ]);
        });

        it("asks for the folders of the model it is given each time", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);

            await adapter.listFolders("article");
            await adapter.listFolders("author");

            expect(listFoldersExecute.mock.calls).toEqual([["cms:article"], ["cms:author"]]);
        });

        it("passes a permission-filtered list through: a child of a hidden folder starts at its own title", async () => {
            const { adapter, listFoldersExecute } = createAdapter(
                [],
                [createFolder("folder-b", "Spring", "folder-hidden")]
            );

            const folders = await adapter.listFolders("article");

            expect(folders).toEqual([{ id: "folder-b", path: "/Spring" }]);
            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
        });

        it("lists nothing and sends no request without a model", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);

            const folders = await adapter.listFolders(null);

            expect(folders).toEqual([]);
            expect(listFoldersExecute).not.toHaveBeenCalled();
        });

        it("rejects when the folders cannot be loaded", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);
            const failure = new Error("Could not fetch folders");
            listFoldersExecute.mockRejectedValue(failure);

            await expect(adapter.listFolders("article")).rejects.toBe(failure);
        });
    });
});
