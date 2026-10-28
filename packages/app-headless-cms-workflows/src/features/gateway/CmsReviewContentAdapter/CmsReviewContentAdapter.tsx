import React from "react";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { Routes } from "@webiny/app-headless-cms/routes.js";
import type { ReviewContentRef } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { renderModelIconOrFallback } from "~/utils/renderModelIconOrFallback.js";
import { isCmsAppName } from "~/utils/appName.js";
import { parseAppName } from "~/utils/appName.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./abstractions.js";

class CmsReviewContentAdapterImpl implements AdapterAbstraction.Interface {
    constructor(private modelsCache: ModelsCache.Interface) {}

    canHandle(namespace: string): boolean {
        return isCmsAppName(namespace);
    }

    getContentUrl(ref: ReviewContentRef): string {
        const modelId = parseAppName(ref.namespace);
        const encodedModelId = encodeURIComponent(modelId);
        const encodedRevisionId = encodeURIComponent(ref.targetRevisionId);
        const path = Routes.ContentEntries.List.path.replace(":modelId", encodedModelId);

        return `${path}?id=${encodedRevisionId}`;
    }

    getContentTypeLabel(contentTypeId: string): string | null {
        const model = this.modelsCache.getItem(item => item.modelId === contentTypeId);

        if (!model) {
            return null;
        }

        return model.name;
    }

    renderContentTypeIcon(contentTypeId: string): React.ReactNode {
        const model = this.modelsCache.getItem(item => item.modelId === contentTypeId);
        return renderModelIconOrFallback(model, contentTypeId);
    }
}

export const CmsReviewContentAdapter = AdapterAbstraction.createImplementation({
    implementation: CmsReviewContentAdapterImpl,
    dependencies: [ModelsCache]
});
