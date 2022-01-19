import { CmsModelField } from "@webiny/api-headless-cms/types";
import get from "lodash/get";
import {
    ApwContentReviewStep,
    ApwContentReviewStepStatus,
    ApwReviewerCrud,
    ApwWorkflowStep,
    ApwWorkflowStepTypes
} from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface CreateModelFieldParams extends Omit<CmsModelField, "id" | "fieldId"> {
    parent: string;
}

export interface HasReviewersParams {
    identity: SecurityIdentity;
    step: ApwContentReviewStep;
    getReviewer: ApwReviewerCrud["get"];
}

export const hasReviewer = async ({
    getReviewer,
    identity,
    step
}: HasReviewersParams): Promise<Boolean> => {
    for (const stepReviewer of step.reviewers) {
        const entry = await getReviewer(stepReviewer.id);

        if (entry.identityId === identity.id) {
            return true;
        }
    }

    return false;
};

export const getValue = (object: Record<string, any>, key: string) => {
    return get(object, `values.${key}`);
};

export const getContentReviewStepInitialStatus = (
    workflowSteps: ApwWorkflowStep[],
    index: number,
    previousStepStatus: ApwContentReviewStepStatus
): ApwContentReviewStepStatus => {
    /**
     * Always set first step 'active' by default.
     */
    if (index === 0) {
        return ApwContentReviewStepStatus.ACTIVE;
    }

    const previousStep = workflowSteps[index - 1];
    if (
        previousStepStatus === ApwContentReviewStepStatus.ACTIVE &&
        previousStep.type !== ApwWorkflowStepTypes.MANDATORY_BLOCKING
    ) {
        return ApwContentReviewStepStatus.ACTIVE;
    }

    return ApwContentReviewStepStatus.INACTIVE;
};

export const getNextStepStatus = (
    previousStepType: ApwWorkflowStepTypes,
    previousStepStatus: ApwContentReviewStepStatus
): ApwContentReviewStepStatus => {
    if (previousStepStatus === ApwContentReviewStepStatus.DONE) {
        return ApwContentReviewStepStatus.ACTIVE;
    }

    if (
        previousStepStatus === ApwContentReviewStepStatus.ACTIVE &&
        previousStepType !== ApwWorkflowStepTypes.MANDATORY_BLOCKING
    ) {
        return ApwContentReviewStepStatus.ACTIVE;
    }

    return ApwContentReviewStepStatus.INACTIVE;
};
