import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeReviewContentAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { WbWorkflowEditorAppAdapter } from "./abstractions.js";
import { WbWorkflowEditorMountingFeature } from "./feature.js";

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
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    WbWorkflowEditorMountingFeature.register(container);

    return { container, client };
};

describe("WbWorkflowEditorMountingFeature", () => {
    it("resolves only the app adapter for the view: no use case in the plugin pass (R349, R354)", () => {
        const { container } = createContainer();

        const resolved = WbWorkflowEditorMountingFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["app"]);
        expect(resolved.app.appKind).toBe("wb");
        expect(resolved.app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the app-aco folder gateway so the adapter lists the folders", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: {
                listFolders: {
                    data: [
                        createFolder("folder-a", "Landing pages", "root"),
                        createFolder("folder-b", "Autumn", "folder-a")
                    ],
                    error: null
                }
            }
        });
        const { app } = WbWorkflowEditorMountingFeature.resolve(container);

        const folders = await app.listFolders("page");

        expect(folders).toEqual([
            { id: "folder-a", path: "/Landing pages" },
            { id: "folder-b", path: "/Landing pages/Autumn" }
        ]);
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            type: "wb:page",
            limit: 10000
        });
    });

    it("rejects when the folder query returns no data", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: { listFolders: { data: null, error: { message: "Not allowed." } } }
        });
        const { app } = WbWorkflowEditorMountingFeature.resolve(container);

        await expect(app.listFolders("page")).rejects.toThrow("Not allowed.");
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(WbWorkflowEditorAppAdapter);
        const second = container.resolve(WbWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
