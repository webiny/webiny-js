import lodashSet from "lodash/set";
import { ApwContentReviewStepStatus, ApwContext } from "~/types";
import { getContentReviewStepInitialStatus } from "~/plugins/utils";
import { NotFoundError } from "@webiny/handler-graphql";
import { getContentApwSettingsPlugin } from "~/utils/contentApwSettingsPlugin";

export const initializeContentReviewSteps = ({ apw, plugins }: ApwContext) => {
    apw.contentReview.onBeforeContentReviewCreate.subscribe(async ({ input }) => {
        const { type, id, settings } = input.content;
        /*
         * Let's set "title" field value.
         */
        const getContent = apw.getContentGetter(type);
        const content = await getContent(id, settings);
        if (!content) {
            throw new NotFoundError(`Content "${type}" with id ${id} not found.`);
        }

        const { title } = content;
        input = lodashSet(input, "title", title);

        /**
         * We need to find a plugin which can get a workflow ID for the given type of content.
         */
        const contentApwSettingsPlugin = getContentApwSettingsPlugin({
            plugins,
            type
        });

        const workflowId = contentApwSettingsPlugin.getWorkflowId(content);

        /**
         * Let's initialize the "ContentReview" steps.
         */
        if (!workflowId) {
            throw new NotFoundError(`Unable to initiate a "Content review". No workflow found!`);
        }

        const workflow = await apw.workflow.get(workflowId);
        const workflowSteps = workflow.steps;

        let previousStepStatus: ApwContentReviewStepStatus | undefined = undefined;
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
        /**
         * TODO Figure our what does this actually do?
         * There is no steps property on CreateApwContentReviewParams
         */
        input = lodashSet(input, "steps", updatedSteps);
    });
};
