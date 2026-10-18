import type { ReactNode } from "react";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";

/*
 * What the shared editor needs from one app besides the editor use cases (R202): the panel label,
 * the wording of the header, the one-time setup, the model icon and the content adapter that links
 * a blocking review to its content. The app package implements it (Tasks 20, 21) and passes it to
 * the view as a prop. `app-workflows` has no icon library, so the app renders the icon.
 */
export interface WorkflowEditorAppAdapter {
    appKind: WorkflowEditorAppKind;
    // `Content models` for the CMS, `Website Builder` for the WB (the panel's style shows it uppercase, R280).
    panelLabel: string;
    // The header's `Applies to {Model} · {appliesToLabel}`.
    appliesToLabel: string;
    // Runs once before the model list is shown (the CMS fills the admin `ModelsCache`); the WB does nothing.
    init(): Promise<void>;
    // The icon of a model row by its `modelId`; null for none.
    renderModelIcon(modelId: string): ReactNode;
    contentAdapter: IReviewContentAdapter;
}
