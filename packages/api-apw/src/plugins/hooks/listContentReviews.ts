import { AdvancedPublishingWorkflow } from "~/types";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";

interface ListWorkflowsParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
    security: Security;
}
export const listContentReviews = ({ apw, security }: ListWorkflowsParams) => {
    /**
     * We need to hook into listing the content review entries.
     * When listing content review entries, we need to check which ones current user can actually see.
     */
    apw.contentReview.onContentReviewBeforeList.subscribe(async ({ where }) => {
        /**
         * If there is workflowId_in attached on where, we will not change it.
         */
        if (where.workflowId_in) {
            return;
        }
        const identity = security.getIdentity();
        if (!identity?.id) {
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
         * Find all workflows which user has access to.
         * User access is buried quite deep in the workflow data, so we need to do some traversing.
         */
        const userWorkflows = workflows.filter(workflow => {
            return workflow.steps.some(step => {
                return step.reviewers.some(reviewer => {
                    return identity.id === reviewer.identityId;
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
