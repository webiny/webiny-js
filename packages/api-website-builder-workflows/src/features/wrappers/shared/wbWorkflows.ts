import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import {
    belongsToApp,
    isAppWorkflow
} from "@webiny/api-workflows/domain/workflow/isAppWorkflow.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

export const WB_PAGES_ONLY = 'A Website Builder workflow can only be bound to pages ("wb.page").';

/** The only Website Builder namespace in v1. */
export const isWbPageNamespace = (model: string): boolean => {
    return model === WB_PAGE_NAMESPACE;
};

/** Every model is `wb.page`; an empty list is left to the engine's validation. */
export const belongsToWb = (models: string[]): boolean => {
    return belongsToApp(models, isWbPageNamespace);
};

/** A stored workflow of the Website Builder app (R46). */
export const isWbWorkflow = (workflow: WorkflowValues): boolean => {
    return isAppWorkflow(workflow, isWbPageNamespace);
};
