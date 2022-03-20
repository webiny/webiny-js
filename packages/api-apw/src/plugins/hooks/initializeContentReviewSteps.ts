import lodashSet from "lodash/set";
import get from "lodash/get";
import { ApwContentReviewStepStatus, LifeCycleHookCallbackParams } from "~/types";
import { getContentReviewStepInitialStatus } from "~/plugins/utils";
import { NotFoundError } from "@webiny/handler-graphql";

export const initializeContentReviewSteps = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.contentReview.onBeforeContentReviewCreate.subscribe(async ({ input }) => {
        const { type, id, settings } = input.content;
        /*
         * Let's set "title" field value.
         */
        const getContent = apw.getContentGetter(type);
        const content = await getContent(id, settings);
        if (content) {
            const { title } = content;
            input = lodashSet(input, "title", title);
        }

        const workflowId = get(content, "settings.apw.workflowId");

        /**
         * Let's initialize the "ContentReview" steps.
         */
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
                pendingChangeRequests: 0,
                totalComments: 0
            };
        });

        input = lodashSet(input, "steps", updatedSteps);
    });
};
