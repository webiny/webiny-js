import lodashSet from "lodash/set";
import { AdvancedPublishingWorkflow, ApwContentTypes, LifeCycleHookCallbackParams } from "~/types";
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

export const initializeContentReviewSteps = ({ cms, apw }: LifeCycleHookCallbackParams) => {
    cms.onBeforeEntryCreate.subscribe(async ({ model, entry, input }) => {
        const contentReviewModel = await apw.contentReview.getModel();
        /**
         * If created entry is of "contentReview" model, let's initialize the steps.
         */
        if (model.modelId === contentReviewModel.modelId) {
            // @ts-ignore
            const workflowId = await getWorkflowIdFromContent(apw, input.content);
            if (!workflowId) {
                throw new NotFoundError(
                    `Unable to initiate a "Content review". No workflow found!`
                );
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
                    /**
                     * We're using the "slug" field from workflow step (which is non-unique string)
                     * to setup a link between "Change request" and "Content review".
                     * And because there can be multiple "content reviews" for same workflow,
                     * we're normalizing them to be unique here.
                     */
                    slug: `${entry.entryId}#${step.slug}`,
                    /**
                     * Always set first step 'active' by default.
                     */
                    status,
                    pendingChangeRequests: 0
                };
            });

            entry = lodashSet(entry, "values.steps", updatedSteps);
        }
    });
};
