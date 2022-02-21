import lodashSet from "lodash/set";
import {
    AdvancedPublishingWorkflow,
    ApwContentReviewStepStatus,
    ApwContentTypes,
    LifeCycleHookCallbackParams
} from "~/types";
import { getContentReviewStepInitialStatus } from "~/plugins/utils";
import { NotFoundError } from "@webiny/handler-graphql";

export const getWorkflowIdFromContent = async (
    apw: AdvancedPublishingWorkflow,
    params: { type: ApwContentTypes; id: string; settings: Record<string, any> }
): Promise<string> => {
    switch (params.type) {
        case ApwContentTypes.PAGE:
            const getWorkflowFromPage = apw.getWorkflowGetter(ApwContentTypes.PAGE);
            return getWorkflowFromPage(params.id, {});

        case ApwContentTypes.CMS_ENTRY:
            const getWorkflowFromCmsEntry = apw.getWorkflowGetter(ApwContentTypes.CMS_ENTRY);
            return getWorkflowFromCmsEntry(params.id, params.settings);
    }
    return null;
};

export const initializeContentReviewSteps = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.contentReview.onBeforeContentReviewCreate.subscribe(async ({ input }) => {
        /**
         * Let's initialize the "ContentReview" steps.
         */
        const workflowId = await getWorkflowIdFromContent(apw, input.content);

        if (!workflowId) {
            throw new NotFoundError(`Unable to initiate a "Content review". No workflow found!`);
        }

        const workflow = await apw.workflow.get(workflowId);
        const workflowSteps = workflow.steps;

        let previousStepStatus: ApwContentReviewStepStatus;
        const updatedSteps = workflow.steps.map((step, index) => {
            const status = getContentReviewStepInitialStatus(
                workflowSteps,
                index,
                previousStepStatus
            );
            previousStepStatus = status;
            return {
                ...step,
                status,
                pendingChangeRequests: 0
            };
        });

        input = lodashSet(input, "steps", updatedSteps);
    });
};
