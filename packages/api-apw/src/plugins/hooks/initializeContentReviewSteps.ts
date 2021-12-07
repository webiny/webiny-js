import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContentReviewStepStatus, ApwContext, PageWithWorkflow } from "~/types";
import lodashSet from "lodash/set";

/**
 * TODO: @ashutosh Convert it to use plugins.
 */
const getWorkflowIdFromContent = async (
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
                const workflow = await context.advancedPublishingWorkflow.workflow.get(workflowId);

                entry = lodashSet(
                    entry,
                    "values.steps",
                    workflow.values.steps.map(step => ({
                        /**
                         * We're using the "slug" field from workflow step (which is non-unique string)
                         * to setup a link between "Change request" and "Content review".
                         * And because there can be multiple "content reviews" for same workflow,
                         * we're normalizing them to be unique here.
                         */
                        slug: `${entry.entryId}#${step.slug}`,
                        status: ApwContentReviewStepStatus.INACTIVE
                    }))
                );
            }
        });
    });

export default () => [initializeContentReviewSteps()];
