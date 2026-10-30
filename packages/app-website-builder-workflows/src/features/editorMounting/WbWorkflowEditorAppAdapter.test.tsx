import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeReviewContentAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";

interface RenderedIconProps {
    label: string;
}

const contentAdapter = createFakeContentAdapter();

const createAdapterWithGateway = (folders: FolderDto[] = []) => {
    const container = new Container();
    // Mirrors the gateway of app-aco: the virtual root row comes first.
    const rootFolder = RootFolder.create();
    const listFoldersExecute = vi
        .fn<ListFoldersGateway.Interface["execute"]>()
        .mockResolvedValue([rootFolder, ...folders]);
    container.registerInstance(ListFoldersGateway, { execute: listFoldersExecute });
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.register(WbWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, listFoldersExecute };
};

const createAdapter = () => {
    return createAdapterWithGateway().adapter;
};

describe("WbWorkflowEditorAppAdapter", () => {
    it("describes the Website Builder app", () => {
        const adapter = createAdapter();

        expect(adapter.appKind).toBe("wb");
        expect(adapter.panelLabel).toBe("Website Builder");
        expect(adapter.appliesToLabel).toBe("Website Builder");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("loads nothing on init", async () => {
        const adapter = createAdapter();

        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("renders the Pages icon for any model id", () => {
        const adapter = createAdapter();

        const node = adapter.renderModelIcon("wb.page");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Pages");
    });

    describe("folders (R292)", () => {
        it("names the page folder type wb:page whatever the model id", () => {
            const adapter = createAdapter();

            expect(adapter.getFolderType(null)).toBe("wb:page");
            expect(adapter.getFolderType("page")).toBe("wb:page");
            expect(adapter.getFolderType("anything")).toBe("wb:page");
        });

        it("lists the page folders with the type wb:page, root excluded, and the title paths", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway([
                createFolder("folder-a", "Landing pages", ROOT_FOLDER),
                createFolder("folder-b", "Autumn", "folder-a"),
                createFolder("folder-c", "Blog", ROOT_FOLDER)
            ]);

            const folders = await adapter.listFolders("page");

            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
            expect(listFoldersExecute).toHaveBeenCalledWith("wb:page");
            expect(folders).toEqual([
                { id: "folder-a", path: "/Landing pages" },
                { id: "folder-b", path: "/Landing pages/Autumn" },
                { id: "folder-c", path: "/Blog" }
            ]);
        });

        it("ignores the model id, also null", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway();

            await adapter.listFolders(null);
            await adapter.listFolders("anything");

            expect(listFoldersExecute.mock.calls).toEqual([["wb:page"], ["wb:page"]]);
        });

        it("passes a permission-filtered list through: a child of a hidden folder starts at its own title", async () => {
            const { adapter } = createAdapterWithGateway([
                createFolder("folder-b", "Autumn", "folder-hidden")
            ]);

            const folders = await adapter.listFolders("page");

            expect(folders).toEqual([{ id: "folder-b", path: "/Autumn" }]);
        });

        it("rejects when the folders cannot be loaded", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway();
            const failure = new Error("Could not fetch folders");
            listFoldersExecute.mockRejectedValue(failure);

            await expect(adapter.listFolders("page")).rejects.toBe(failure);
        });
    });
});
