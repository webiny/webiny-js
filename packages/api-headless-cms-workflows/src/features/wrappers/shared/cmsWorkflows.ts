import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import {
    belongsToApp,
    isAppWorkflow
} from "@webiny/api-workflows/domain/workflow/isAppWorkflow.js";
import { isCmsNamespace } from "~/utils/appName.js";

export const CMS_MODELS_ONLY =
    'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").';

/** Every model is a `cms.<modelId>` namespace; an empty list is left to the engine's validation. */
export const belongsToCms = (models: string[]): boolean => {
    return belongsToApp(models, isCmsNamespace);
};

/** A stored workflow of the Headless CMS app (R46). */
export const isCmsWorkflow = (workflow: WorkflowValues): boolean => {
    return isAppWorkflow(workflow, isCmsNamespace);
};
