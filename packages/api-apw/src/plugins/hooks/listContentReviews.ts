import { AdvancedPublishingWorkflow } from "~/types";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { CONTENT_REVIEW_MODEL_ID } from "~/storageOperations/models/contentReview.model";
import { Security } from "@webiny/api-security/types";

interface ListWorkflowsParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
    security: Security;
}
export const listContentReviews = ({ apw, cms, security }: ListWorkflowsParams) => {
    /**
     * We need to hook into listing the content review entries.
     * When listing content review entries, we need to check which ones current user can actually see.
     */
    cms.onBeforeEntryList.subscribe(async ({ model, where }) => {
        const identity = security.getIdentity();
        if (!identity?.id || model.modelId !== CONTENT_REVIEW_MODEL_ID) {
            return;
        }
        /**
         * Find all available workflows.
         */
        const [workflows] = await apw.workflow.list();
        if (workflows.length === 0) {
            return;
        }
        /**
         * We need to find the reviewer entryId to be able to match it to the reviewer entryId in the workflow steps.
         */
        const [reviewers] = await apw.reviewer.list({
            where: {
                identityId: identity.id
            }
        });
        if (reviewers.length === 0) {
            return;
        }
        const reviewerList = reviewers.map(reviewer => reviewer.entryId);
        /**
         * Find all workflows which user has access to.
         * User access is buried quite deep in the workflow data, so we need to do some traversing.
         */
        const userWorkflows = workflows.filter(workflow => {
            return workflow.steps.some(step => {
                return step.reviewers.some(reviewer => {
                    return reviewerList.includes(reviewer.entryId);
                });
            });
        });
        if (userWorkflows.length === 0) {
            return;
        }
        /**
         * In the end, we need to attach the workflow filter by the entryId.
         * Just in case we add versioning at some point...
         */
        where.workflowId_in = userWorkflows.map(workflow => workflow.id);
    });
};
