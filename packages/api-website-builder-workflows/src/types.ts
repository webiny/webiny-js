import type { WebsiteBuilderContext } from "@webiny/api-website-builder";
import type { Context as WorkflowsContext } from "@webiny/api-workflows/types.js";

export interface Context extends WebsiteBuilderContext, WorkflowsContext {
    //
}


export interface IWbPageState {
    workflowId: string;
    stepId: string;
    stepName: string;
    state: string;
}
