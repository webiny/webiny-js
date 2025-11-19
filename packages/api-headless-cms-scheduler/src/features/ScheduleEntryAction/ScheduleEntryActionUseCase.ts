import { Result } from "@webiny/feature/api";
import { ScheduleEntryActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction } from "@webiny/api-scheduler";
import { ScheduleActionUseCase } from "@webiny/api-scheduler";
import { RunActionUseCase } from "@webiny/api-scheduler";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";

/**
 * Schedules a CMS entry action (publish or unpublish)
 *
 * Flow:
 * 1. If immediately=true, use RunAction for immediate execution
 * 2. Otherwise, fetch entry to get title metadata
 * 3. Use ScheduleAction with entry title in payload
 */
class ScheduleEntryActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private scheduleActionUseCase: ScheduleActionUseCase.Interface,
        private runActionUseCase: RunActionUseCase.Interface,
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IScheduledAction, UseCaseAbstraction.Error>> {
        const namespace = `Cms/Entry/${input.modelId}`;

        // Handle immediate execution
        if (input.immediately) {
            const result = await this.runActionUseCase.execute({
                namespace,
                actionType: input.actionType,
                targetId: input.targetId,
                payload: {
                    modelId: input.modelId
                }
            });

            if (result.isFail()) {
                return Result.fail(result.error);
            }

            return Result.ok(result.value);
        }

        // Validate scheduleOn is provided for future scheduling
        if (!input.scheduleOn) {
            throw new Error("scheduleOn is required when immediately is not true");
        }

        // Fetch the target model
        const modelResult = await this.getModelUseCase.execute(input.modelId);
        if (modelResult.isFail()) {
            return Result.fail(modelResult.error as any);
        }

        const model = modelResult.value;

        // Fetch entry to get title
        const entryResult = await this.getEntryByIdUseCase.execute(model, input.targetId);
        if (entryResult.isFail()) {
            return Result.fail(entryResult.error as any);
        }

        const entry = entryResult.value;
        const title = entry.values[model.titleFieldId] || "Unknown entry title";

        // Schedule with title metadata
        const scheduleResult = await this.scheduleActionUseCase.execute({
            namespace,
            actionType: input.actionType,
            targetId: input.targetId,
            title,
            input: {
                scheduleOn: input.scheduleOn
            },
            payload: {
                modelId: input.modelId
            }
        });

        if (scheduleResult.isFail()) {
            return Result.fail(scheduleResult.error);
        }

        return Result.ok(scheduleResult.value);
    }
}

export const ScheduleEntryActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: ScheduleEntryActionUseCaseImpl,
    dependencies: [ScheduleActionUseCase, RunActionUseCase, GetModelUseCase, GetEntryByIdUseCase]
});
