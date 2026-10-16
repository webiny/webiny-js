import { Routes } from "@webiny/app-website-builder/routes.js";
import type { ReviewContentRef } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { assertWbPageNamespace } from "./assertWbPageNamespace.js";

class WbReviewContentAdapterImpl implements AdapterAbstraction.Interface {
    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    getContentUrl(ref: ReviewContentRef): string {
        assertWbPageNamespace(ref.namespace);

        return Routes.Pages.Editor.path.replace(":id", encodeURIComponent(ref.targetRevisionId));
    }

    getContentTypeLabel(): string | null {
        return null;
    }
}

export const WbReviewContentAdapter = AdapterAbstraction.createImplementation({
    implementation: WbReviewContentAdapterImpl,
    dependencies: []
});
