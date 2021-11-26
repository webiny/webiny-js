import { Page } from "@webiny/api-page-builder/types";

export interface PageWithWorkflow extends Page {
    workflow?: Record<string, any>;
}

export enum WorkflowScopeTypes {
    DEFAULT = "default",
    PB_CATEGORY = "pb_category",
    CMS_MODEL = "cms_model",
    SPECIFIC = "specific"
}
