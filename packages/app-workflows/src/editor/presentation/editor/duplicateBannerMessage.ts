import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";

// Every save failure banner starts with this (R276, R281).
export const SAVE_FAILURE_PREFIX = "Could not save the workflow — ";

export interface DuplicateBannerParams {
    appKind: WorkflowEditorAppKind;
    modelName: string;
    workflowName: string;
}

// QBZ-44: the Website Builder says pages; the CMS says model.
export const duplicateBannerMessage = (params: DuplicateBannerParams): string => {
    const prefix = SAVE_FAILURE_PREFIX;
    if (params.appKind === "wb") {
        return `${prefix}${params.modelName} already have a workflow: “${params.workflowName}”. ${params.modelName} can have one workflow.`;
    }
    return `${prefix}${params.modelName} already has a workflow: “${params.workflowName}”. A model can have one workflow.`;
};
