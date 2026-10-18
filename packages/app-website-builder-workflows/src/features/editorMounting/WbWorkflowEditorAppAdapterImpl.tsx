import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { WB_PAGE_APP as WB_PAGE_FOLDER_TYPE } from "@webiny/app-website-builder/constants.js";
import type { AppFolder } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";
import { buildAppFolders } from "@webiny/app-workflows/editor/folders/buildAppFolders.js";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";

/*
 * The Website Builder knowledge of the shared editor view (R280): one model, Pages, so there is no
 * list to load and one fixed icon. The folders are the page folders, type `wb:page`, whatever the
 * model id (R292).
 */
class WbWorkflowEditorAppAdapterImpl implements AdapterAbstraction.Interface {
    public readonly appKind = "wb";
    public readonly panelLabel = "Website Builder";
    public readonly appliesToLabel = "Website Builder";

    constructor(
        public readonly contentAdapter: WbReviewContentAdapter.Interface,
        private listFoldersGateway: ListFoldersGateway.Interface
    ) {}

    async init(): Promise<void> {
        // Pages need nothing loaded.
    }

    renderModelIcon(): React.ReactNode {
        return (
            <Icon icon={<PagesIcon />} label="Pages" size="sm" className="text-neutral-strong" />
        );
    }

    getFolderType(): string {
        return WB_PAGE_FOLDER_TYPE;
    }

    async listFolders(): Promise<AppFolder[]> {
        const type = this.getFolderType();
        const folders = await this.listFoldersGateway.execute(type);

        return buildAppFolders(folders, ROOT_FOLDER);
    }
}

export const WbWorkflowEditorAppAdapter = AdapterAbstraction.createImplementation({
    implementation: WbWorkflowEditorAppAdapterImpl,
    dependencies: [WbReviewContentAdapter, ListFoldersGateway]
});
