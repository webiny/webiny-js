import { ScheduleUnpublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    ScheduleActionUseCase,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class ScheduleUnpublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private scheduleAction: ScheduleActionUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private getModelUseCase: GetModelUseCase.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Result {
        const { model: initialModel, scheduleFor, tenant, id } = params;

        const modelResult = await this.getModelUseCase.execute(initialModel.modelId);
        if (modelResult.isFail()) {
            return Result.fail(modelResult.error as any);
        }
        const model = modelResult.value;

        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "u" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model) as any);
        }

        const scheduleResult = await this.scheduleAction.execute({
            namespace: createNamespace(model),
            actionType: ScheduledActionTypeUnpublish,
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

export const ScheduleUnpublishEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: ScheduleUnpublishEntryUseCaseImpl,
    dependencies: [ScheduleActionUseCase, AccessControl, GetModelUseCase]
});
