import type { ReviewSystemWorkflow } from "@webiny/api-workflows/domain/review/types.js";

/** Filterable keys of `system.workflow`; text values, with `_in` for a list. */
export interface CmsEntryListWhereSystemWorkflow {
    workflowId?: string;
    workflowId_in?: string[];
    reviewState?: string;
    reviewState_in?: string[];
    stepId?: string;
    stepId_in?: string[];
    stepState?: string;
    stepState_in?: string[];
}

declare module "@webiny/api-headless-cms/types/types.js" {
    export interface ICmsEntrySystem {
        /**
         * Review state of this revision (spec 4.5), written only through `ReviewTargetSync`.
         * Filterable through `WorkflowEntrySystemField`.
         */
        workflow?: ReviewSystemWorkflow | null;
    }

    export interface CmsEntryListWhereSystem {
        workflow?: CmsEntryListWhereSystemWorkflow;
    }
}
