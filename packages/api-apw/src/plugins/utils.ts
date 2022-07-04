import get from "lodash/get";
import { customAlphabet } from "nanoid";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContentReviewCrud,
    ApwContentReviewStep,
    ApwContentReviewStepStatus,
    ApwContext,
    ApwReviewerCrud,
    ApwWorkflow,
    ApwWorkflowStep,
    ApwWorkflowStepTypes,
    WorkflowScopeTypes
} from "~/types";

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);

export interface CreateModelFieldParams extends Omit<CmsModelField, "id" | "fieldId"> {
    parent: string;
}

export interface HasReviewersParams {
    identity: SecurityIdentity;
    step: ApwContentReviewStep;
    getReviewer: ApwReviewerCrud["get"];
}

export const hasReviewer = async (params: HasReviewersParams): Promise<Boolean> => {
    const { getReviewer, identity, step } = params;
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
    previousStepStatus?: ApwContentReviewStepStatus
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

export interface ExtractContentReviewIdAndStepResult {
    id: string;
    stepId: string;
}

export const extractContentReviewIdAndStep = (
    step: ApwChangeRequest["step"]
): ExtractContentReviewIdAndStepResult => {
    /*
     * Get associated content review entry.
     */
    const [entryId, version, stepId] = step.split("#");
    const revisionId = `${entryId}#${version}`;

    return {
        id: revisionId,
        stepId
    };
};

type SafelyGetContentReviewParams = Pick<UpdateContentReviewParams, "id" | "contentReviewMethods">;

export const safelyGetContentReview = async ({
    id,
    contentReviewMethods
}: SafelyGetContentReviewParams): Promise<ApwContentReview | null> => {
    let contentReviewEntry = null;
    try {
        contentReviewEntry = await contentReviewMethods.get(id);
    } catch (e) {
        if (e.message !== "index_not_found_exception" && e.code !== "NOT_FOUND") {
            throw e;
        }
    }

    return contentReviewEntry;
};

export interface UpdateContentReviewParams {
    id: string;
    contentReviewMethods: ApwContentReviewCrud;
    getNewContentReviewData: (entry: ApwContentReview) => ApwContentReview;
}

export const updateContentReview = async ({
    contentReviewMethods,
    id,
    getNewContentReviewData
}: UpdateContentReviewParams): Promise<void> => {
    const contentReviewEntry = await safelyGetContentReview({ id, contentReviewMethods });
    if (contentReviewEntry) {
        const newContentReviewData = getNewContentReviewData(contentReviewEntry);
        /**
         * Update content review entry.
         */
        await contentReviewMethods.update(contentReviewEntry.id, newContentReviewData);
    }
};

export const updateContentReviewStep = (
    steps: ApwContentReviewStep[],
    stepId: string,
    updater: (step: ApwContentReviewStep) => ApwContentReviewStep
): ApwContentReviewStep[] => {
    return steps.map(step => {
        if (step.id === stepId) {
            return {
                ...updater(step)
            };
        }
        return step;
    });
};

type CheckInstallationParams = Pick<ApwContext, "tenancy" | "i18n">;

export const isInstallationPending = ({ tenancy, i18n }: CheckInstallationParams): boolean => {
    /**
     * In case of a fresh webiny project "tenant" and "locale" won't be there until
     * installation is completed. So, we need to skip "APW" creation till then.
     */
    const tenant = tenancy.getCurrentTenant();
    if (!tenant) {
        return true;
    }

    return !i18n.getContentLocale();
};

const WORKFLOW_PRECEDENCE = {
    [WorkflowScopeTypes.DEFAULT]: 0,
    [WorkflowScopeTypes.CUSTOM]: 1
};

export const workflowByPrecedenceDesc = (a: ApwWorkflow, b: ApwWorkflow) => {
    const scoreA = WORKFLOW_PRECEDENCE[a.scope.type];
    const scoreB = WORKFLOW_PRECEDENCE[b.scope.type];
    /**
     * In descending order of workflow precedence.
     */
    return scoreB - scoreA;
};

export const workflowByCreatedOnDesc = (a: ApwWorkflow, b: ApwWorkflow) => {
    const createdOnA = get(a, "createdOn");
    const createdOnB = get(b, "createdOn");
    /**
     * In descending order of workflow createdOn i.e. the most recent one first.
     */
    return new Date(createdOnB).getTime() - new Date(createdOnA).getTime();
};
