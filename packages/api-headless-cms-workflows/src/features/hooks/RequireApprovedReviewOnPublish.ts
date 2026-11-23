import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { ApprovedReviewPublishRule } from "~/features/publishRule/ApprovedReviewPublishRule/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Publish rule of the `cms.*` adapter (spec 5.1, D79, D121, R53). On a model bound to a workflow a
 * revision is published only with its active review approved; an approved revision that was
 * unpublished can be published again because approved reviews stay active (D23). Lookup failures
 * block (fail closed). `system.workflow` is not trusted: the update input can set it. Private
 * models (Website Builder pages, R52) are left to their app (`RequireApprovedReviewOnPagePublish`).
 * Only the publish actions are guarded (this and `RequireApprovedReviewOnRepublish`): creating
 * content as published stays allowed for data transfer (D134 point 2, R83). The rule itself is
 * `ApprovedReviewPublishRule`, shared with the scheduler guard.
 */
class RequireApprovedReviewOnPublishImpl implements EntryBeforePublishEventHandler.Interface {
    public constructor(private publishRule: ApprovedReviewPublishRule.Interface) {}

    public async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const allowed = await this.publishRule.check({
            namespace,
            targetRevisionId: original.id
        });
        if (allowed.isFail()) {
            throw allowed.error;
        }
    }
}

export const RequireApprovedReviewOnPublish = EntryBeforePublishEventHandler.createImplementation({
    implementation: RequireApprovedReviewOnPublishImpl,
    dependencies: [ApprovedReviewPublishRule]
});
