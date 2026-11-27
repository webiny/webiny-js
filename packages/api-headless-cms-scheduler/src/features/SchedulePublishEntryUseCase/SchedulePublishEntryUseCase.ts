import { SchedulePublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    ScheduleActionUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import {
    EntryNotAuthorizedError,
    EntryValidationError
} from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { isPublishingEnabled } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

class SchedulePublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private scheduleAction: ScheduleActionUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private getModelUseCase: GetModelUseCase.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Result {
        const { model: initialModel, tenant, scheduleFor, id } = params;

        const modelResult = await this.getModelUseCase.execute(initialModel.modelId);
        if (modelResult.isFail()) {
            return Result.fail(modelResult.error as any);
        }
        const model = modelResult.value;

        if (!isPublishingEnabled(model)) {
            return Result.fail(
                new EntryValidationError("Model does not support publishing.") as any
            );
        }

        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "p" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model) as any);
        }

        const scheduleResult = await this.scheduleAction.execute({
            namespace: createNamespace(model),
            actionType: ScheduledActionTypePublish,
            scheduleFor,
            tenant,
            targetId: id
        });
        if (scheduleResult.isFail()) {
            return Result.fail(scheduleResult.error);
        }
        return Result.ok({
            scheduledAction: scheduleResult.value
        });
    }
}

export const SchedulePublishEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: SchedulePublishEntryUseCaseImpl,
    dependencies: [ScheduleActionUseCase, AccessControl, GetModelUseCase]
});
