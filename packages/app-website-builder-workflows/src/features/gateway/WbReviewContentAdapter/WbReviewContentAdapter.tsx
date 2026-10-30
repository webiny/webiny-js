import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Routes } from "@webiny/app-website-builder/routes.js";
import type { ReviewContentRef } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewContentAdapter as AdapterAbstraction } from "./abstractions.js";
import { assertWbPageNamespace } from "../assertWbPageNamespace.js";

class WbReviewContentAdapterImpl implements AdapterAbstraction.Interface {
    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    getContentUrl(ref: ReviewContentRef): string {
        assertWbPageNamespace(ref.namespace);

        const encodedRevisionId = encodeURIComponent(ref.targetRevisionId);

        return Routes.Pages.Editor.path.replace(":id", encodedRevisionId);
    }

    getContentTypeLabel(): string | null {
        return "Pages";
    }

    renderContentTypeIcon(): React.ReactNode {
        return <Icon icon={<PagesIcon />} label="Pages" size="sm" color="neutral-light" />;
    }
}

export const WbReviewContentAdapter = AdapterAbstraction.createImplementation({
    implementation: WbReviewContentAdapterImpl,
    dependencies: []
});
