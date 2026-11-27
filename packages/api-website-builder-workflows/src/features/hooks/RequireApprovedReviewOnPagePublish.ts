import { PageBeforePublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { ApprovedReviewPublishRule } from "@webiny/api-headless-cms-workflows/features/publishRule/ApprovedReviewPublishRule/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Publish rule of the `wb.page` adapter (spec 5.1, D79, D121, R53): with a pages workflow, a page
 * revision is published only with its active review approved. Lookup failures block. The CMS
 * adapter's publish rule skips pages (private model, R52). Creating a page revision as published is
 * not a publish and is not blocked (D134 point 2). The throw rejects `PublishPageUseCase` (A26);
 * WB's page resolvers and the scheduler's publish action keep its code and data (R103). The rule
 * itself is `ApprovedReviewPublishRule`, shared with the scheduler guard.
 */
class RequireApprovedReviewOnPagePublishImpl implements PageBeforePublishEventHandler.Interface {
    public constructor(private publishRule: ApprovedReviewPublishRule.Interface) {}

    public async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const allowed = await this.publishRule.check({
            namespace: WB_PAGE_NAMESPACE,
            targetRevisionId: page.id
        });
        if (allowed.isFail()) {
            throw allowed.error;
        }
    }
}

export const RequireApprovedReviewOnPagePublish =
    PageBeforePublishEventHandler.createImplementation({
        implementation: RequireApprovedReviewOnPagePublishImpl,
        dependencies: [ApprovedReviewPublishRule]
    });
