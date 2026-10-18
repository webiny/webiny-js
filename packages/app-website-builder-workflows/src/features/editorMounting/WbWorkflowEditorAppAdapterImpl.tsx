import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";

/*
 * The Website Builder knowledge of the shared editor view (R280): one model, Pages, so there is no
 * list to load and one fixed icon.
 */
class WbWorkflowEditorAppAdapterImpl implements AdapterAbstraction.Interface {
    public readonly appKind = "wb";
    public readonly panelLabel = "Website Builder";
    public readonly appliesToLabel = "Website Builder";

    constructor(public readonly contentAdapter: WbReviewContentAdapter.Interface) {}

    async init(): Promise<void> {
        // Pages need nothing loaded.
    }

    renderModelIcon(): React.ReactNode {
        return (
            <Icon icon={<PagesIcon />} label="Pages" size="sm" className="text-neutral-strong" />
        );
    }
}

export const WbWorkflowEditorAppAdapter = AdapterAbstraction.createImplementation({
    implementation: WbWorkflowEditorAppAdapterImpl,
    dependencies: [WbReviewContentAdapter]
});
