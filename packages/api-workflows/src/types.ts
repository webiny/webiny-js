import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewSystemWorkflow } from "~/domain/review/types.js";

/**
 * The `workflows` permission (spec 8, D54): `{ name: "workflows", editor?: true, reassign?: true }`;
 * full access is `workflows.*`. A missing flag means the action is not granted.
 */
export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor?: boolean;
    reassign?: boolean;
}

declare module "@webiny/api-headless-cms/types/types.js" {
    export interface ICmsEntrySystem {
        /**
         * Review state of this revision (spec 4.5), written only through `ReviewTargetSync`.
         * Filterable via `CmsEntryListWhereSystemWorkflow` (phase 0).
         */
        workflow?: ReviewSystemWorkflow | null;
    }
}
