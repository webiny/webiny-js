import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { CmsWorkflowEditorAppAdapter } from "./abstractions.js";
import { CmsWorkflowEditorMountingFeature } from "./feature.js";

const contentAdapter = createFakeContentAdapter();

const createContainer = () => {
    const client = { execute: vi.fn() };
    const folderModelProvider = {
        getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
        getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
    };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.registerInstance(FolderModelProvider, folderModelProvider);
    container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));
    container.registerInstance(ListModelsUseCase, { execute: vi.fn().mockResolvedValue([]) });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    CmsWorkflowEditorMountingFeature.register(container);

    return { container, client };
};

describe("CmsWorkflowEditorMountingFeature", () => {
    it("resolves only the app adapter for the view: no use case in the plugin pass (R349, R354)", () => {
        const { container } = createContainer();

        const resolved = CmsWorkflowEditorMountingFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["app"]);
        expect(resolved.app.appKind).toBe("cms");
        expect(resolved.app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the app-aco folder gateway so the adapter lists the folders", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: {
                listFolders: {
                    data: [
                        createFolder("folder-a", "Campaigns", "root"),
                        createFolder("folder-b", "Spring", "folder-a")
                    ],
                    error: null
                }
            }
        });
        const { app } = CmsWorkflowEditorMountingFeature.resolve(container);

        const folders = await app.listFolders("article");

        expect(folders).toEqual([
            { id: "folder-a", path: "/Campaigns" },
            { id: "folder-b", path: "/Campaigns/Spring" }
        ]);
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            type: "cms:article",
            limit: 10000
        });
    });

    it("rejects when the folder query returns no data", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: { listFolders: { data: null, error: { message: "Not allowed." } } }
        });
        const { app } = CmsWorkflowEditorMountingFeature.resolve(container);

        await expect(app.listFolders("article")).rejects.toThrow("Not allowed.");
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(CmsWorkflowEditorAppAdapter);
        const second = container.resolve(CmsWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
