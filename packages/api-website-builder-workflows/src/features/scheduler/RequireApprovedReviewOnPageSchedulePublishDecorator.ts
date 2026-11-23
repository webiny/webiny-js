import { Result } from "@webiny/feature/api";
import {
    ScheduleActionUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { extractModelIdFromNamespace } from "@webiny/api-website-builder-scheduler/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "@webiny/api-website-builder-scheduler/constants.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { ApprovedReviewPublishRule } from "@webiny/api-headless-cms-workflows/features/publishRule/ApprovedReviewPublishRule/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * A scheduled page publish runs the page publish rule when it is due; a refused one publishes
 * nothing and stays scheduled. So scheduling (or rescheduling) the publish of a page revision is
 * refused with the publish rule's own error (`Workflows/Review/PublishBlocked`) whenever
 * publishing it now would be (`ApprovedReviewPublishRule`). Unpublish, redirects and other
 * namespaces pass through.
 */
class RequireApprovedReviewOnPageSchedulePublishDecoratorImpl
    implements ScheduleActionUseCase.Interface
{
    public constructor(
        private publishRule: ApprovedReviewPublishRule.Interface,
        private decoratee: ScheduleActionUseCase.Interface
    ) {}

    public async execute<T extends GenericRecord>(params: ScheduleActionUseCase.Params) {
        if (params.actionType !== ScheduledActionTypePublish) {
            return this.decoratee.execute<T>(params);
        }
        if (extractModelIdFromNamespace(params.namespace) !== SCHEDULED_ACTION_TYPE_PAGE) {
            return this.decoratee.execute<T>(params);
        }

        const allowed = await this.publishRule.check({
            namespace: WB_PAGE_NAMESPACE,
            targetRevisionId: params.targetId
        });
        if (allowed.isFail()) {
            return Result.fail(allowed.error);
        }
        return this.decoratee.execute<T>(params);
    }
}

export const RequireApprovedReviewOnPageSchedulePublishDecorator =
    ScheduleActionUseCase.createDecorator({
        decorator: RequireApprovedReviewOnPageSchedulePublishDecoratorImpl,
        dependencies: [ApprovedReviewPublishRule]
    });
