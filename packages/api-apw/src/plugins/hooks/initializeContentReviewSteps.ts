import lodashSet from "lodash/set";
import { LifeCycleHookCallbackParams } from "~/types";
import { getContentReviewStepInitialStatus } from "~/plugins/utils";
import { NotFoundError } from "@webiny/handler-graphql";

export const initializeContentReviewSteps = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.contentReview.onBeforeContentReviewCreate.subscribe(async ({ input }) => {
        /**
         * Let's initialize the "ContentReview" steps.
         */
        const { workflowId } = input.content;

        if (!workflowId) {
            throw new NotFoundError(`Unable to initiate a "Content review". No workflow found!`);
        }

        const workflow = await apw.workflow.get(workflowId);
        const workflowSteps = workflow.steps;

        let previousStepStatus;
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
