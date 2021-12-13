import { CmsModelField } from "@webiny/api-headless-cms/types";
import camelCase from "lodash/camelCase";
import { ApwContext, ApwWorkflowSteps } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface CreateModelFieldParams extends Omit<CmsModelField, "id" | "fieldId"> {
    parent: string;
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const { label, type, parent } = params;
    const fieldId = camelCase(label);

    return {
        id: `${camelCase(parent)}_${fieldId}`,
        fieldId,
        label,
        type,
        settings: params.settings || {},
        listValidation: params.listValidation || [],
        validation: params.validation || [],
        multipleValues: params.multipleValues || false,
        predefinedValues: params.predefinedValues || {
            values: [],
            enabled: false
        }
    };
};

export interface HasReviewersParams {
    identity: SecurityIdentity;
    context: ApwContext;
    workflowId: string;
    stepIndex: number;
}

export const hasReviewer = async ({
    context,
    workflowId,
    stepIndex,
    identity
}: HasReviewersParams): Promise<Boolean> => {
    /**
     * TODO: @ashutosh
     * Maybe we should copy the entire step data from "Workflow" while creating a "Content Review".
     */
    const workflow = await context.advancedPublishingWorkflow.workflow.get(workflowId);
    const stepFromWorkflow: ApwWorkflowSteps = workflow.values.steps[stepIndex];

    for (const stepReviewer of stepFromWorkflow.reviewers) {
        const reviewerEntry = await context.advancedPublishingWorkflow.reviewer.get(
            stepReviewer.id
        );
        if (reviewerEntry.values.identityId === identity.id) {
            return true;
        }
    }

    return false;
};
