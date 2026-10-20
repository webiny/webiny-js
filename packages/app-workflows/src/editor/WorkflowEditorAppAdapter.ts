import type { ReactNode } from "react";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";

// A folder the admin can see, with the readable path of the rule folder picker (R292).
export interface AppFolder {
    id: string;
    // The titles through the parents, `/A/B`; the root folder is not listed.
    path: string;
}

/*
 * What the shared editor needs from one app besides the editor use cases (R202): the panel label,
 * the wording of the header, the one-time setup, the model icon, the folders of a model and the
 * content adapter that links a blocking review to its content. The app package implements it
 * (Tasks 20, 21) and passes it to the view as a prop. `app-workflows` has no icon library and no
 * dependency on `app-aco`, so the app renders the icon and lists the folders (R292).
 */
export interface WorkflowEditorAppAdapter {
    // The app the editor serves; the editor use cases route by it (R348, A117).
    appKind: WorkflowAppKind;
    // `Content models` for the CMS, `Website Builder` for the WB (the panel's style shows it uppercase, R280).
    panelLabel: string;
    // The header's `Applies to {Model} · {appliesToLabel}`.
    appliesToLabel: string;
    // Runs once before the model list is shown (the CMS fills the admin `ModelsCache`); the WB does nothing.
    init(): Promise<void>;
    // The icon of a model row by its `modelId`; null for none.
    renderModelIcon(modelId: string): ReactNode;
    // The folder type a rule stores and `folderExists` takes: `cms:<modelId>` or `wb:page` (R292).
    getFolderType(modelId: string | null): string;
    // The folders of that type the admin can see (the ACO list is permission-filtered), root
    // excluded. Rejects when the list cannot be loaded.
    listFolders(modelId: string | null): Promise<AppFolder[]>;
    contentAdapter: IReviewContentAdapter;
}
