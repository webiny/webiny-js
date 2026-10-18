import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Icon } from "@webiny/admin-ui";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";

/*
 * The CMS knowledge of the shared editor view (R280): the models list fills the admin
 * `ModelsCache` (the editor's own list carries no icons), the icon is drawn from `CmsModel.icon`.
 * `ListModelsUseCase` fills the cache once and serves it afterwards.
 */
class CmsWorkflowEditorAppAdapterImpl implements AdapterAbstraction.Interface {
    public readonly appKind = "cms";
    public readonly panelLabel = "Content models";
    public readonly appliesToLabel = "Headless CMS model";

    constructor(
        private listModels: ListModelsUseCase.Interface,
        private modelsCache: ModelsCache.Interface,
        public readonly contentAdapter: CmsReviewContentAdapter.Interface
    ) {}

    async init(): Promise<void> {
        try {
            await this.listModels.execute();
        } catch {
            // The icons are cosmetic; an editor without CMS model permissions must still get the editor.
        }
    }

    renderModelIcon(modelId: string): React.ReactNode {
        const model = this.modelsCache.getItem(item => item.modelId === modelId);
        if (!model) {
            return null;
        }

        const icon = normalizeIcon(model.icon);
        if (!icon) {
            return null;
        }

        return (
            <Icon
                icon={<FontAwesomeIcon icon={icon} />}
                label={model.name}
                size="sm"
                className="text-neutral-strong"
            />
        );
    }
}

export const CmsWorkflowEditorAppAdapter = AdapterAbstraction.createImplementation({
    implementation: CmsWorkflowEditorAppAdapterImpl,
    dependencies: [ListModelsUseCase, ModelsCache, CmsReviewContentAdapter]
});
