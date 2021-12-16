import lodashSet from "lodash/set";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext, PageWithWorkflow } from "~/types";
import { getContentReviewStepInitialStatus, getValue } from "~/plugins/utils";

/**
 * TODO: @ashutosh Convert it to use plugins.
 */
export const getWorkflowIdFromContent = async (
    context: ApwContext,
    params: { type: string; id: string; settings: Record<string, any> }
): Promise<string> => {
    switch (params.type) {
        case "page":
            const page = await context.pageBuilder.pages.get<PageWithWorkflow>(params.id);
            return page.workflow;
        case "cms_entry":
            const model = await context.cms.getModel(params.settings.modelId);
            const entry = await context.cms.getEntry(model, { where: { id: params.id } });
            return entry.values.workflow;
    }
    return null;
};

const initializeContentReviewSteps = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.cms.onBeforeEntryCreate.subscribe(async ({ model, entry, input }) => {
            const contentReviewModel =
                await context.advancedPublishingWorkflow.contentReview.getModel();
            /**
             * If created entry is of "contentReview" model, let's initialize the steps.
             */
            if (model.modelId === contentReviewModel.modelId) {
                // @ts-ignore
                const workflowId = await getWorkflowIdFromContent(context, input.content);
                if (!workflowId) {
                    console.info(`Unable to find linked workflow.`);
                    return;
                }
                const workflow = await context.advancedPublishingWorkflow.workflow.get(workflowId);
                const workflowSteps = getValue(workflow, "steps");

                let previousStepStatus;
                const updatedSteps = workflow.values.steps.map((step, index) => {
                    const status = getContentReviewStepInitialStatus(
                        workflowSteps,
                        index,
                        previousStepStatus
                    );
                    previousStepStatus = status;
                    return {
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
    });

export default () => [initializeContentReviewSteps()];
