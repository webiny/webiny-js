import { Result } from "@webiny/feature/api";
import {
    ScheduleActionUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { extractModelIdFromNamespace } from "@webiny/api-headless-cms-scheduler/utils/namespace.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { ApprovedReviewPublishRule } from "~/features/publishRule/ApprovedReviewPublishRule/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * A scheduled publish runs the publish rule when it is due; a refused one publishes nothing and
 * stays scheduled. So scheduling (or rescheduling) the publish of a CMS entry revision is refused
 * with the publish rule's own error (`Workflows/Review/PublishBlocked`) whenever publishing it now
 * would be (`ApprovedReviewPublishRule`). Unpublish, other namespaces and private models (Website
 * Builder pages, R52) pass through; a model that cannot be read is left to the scheduler's own
 * errors.
 */
class RequireApprovedReviewOnSchedulePublishDecoratorImpl
    implements ScheduleActionUseCase.Interface
{
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private publishRule: ApprovedReviewPublishRule.Interface,
        private decoratee: ScheduleActionUseCase.Interface
    ) {}

    public async execute<T extends GenericRecord>(params: ScheduleActionUseCase.Params) {
        if (params.actionType !== ScheduledActionTypePublish) {
            return this.decoratee.execute<T>(params);
        }
        const modelId = extractModelIdFromNamespace(params.namespace);
        if (!modelId) {
            return this.decoratee.execute<T>(params);
        }
        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            return this.decoratee.execute<T>(params);
        }
        const namespace = getCmsNamespace(model.value);
        if (!namespace) {
            return this.decoratee.execute<T>(params);
        }

        const allowed = await this.publishRule.check({
            namespace,
            targetRevisionId: params.targetId
        });
        if (allowed.isFail()) {
            return Result.fail(allowed.error);
        }
        return this.decoratee.execute<T>(params);
    }
}

export const RequireApprovedReviewOnSchedulePublishDecorator =
    ScheduleActionUseCase.createDecorator({
        decorator: RequireApprovedReviewOnSchedulePublishDecoratorImpl,
        dependencies: [GetModelUseCase, ApprovedReviewPublishRule]
    });
