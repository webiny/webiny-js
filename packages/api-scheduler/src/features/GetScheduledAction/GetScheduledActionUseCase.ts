import { Result } from "@webiny/feature/api";
import { GetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "~/domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";

/**
 * Retrieves a scheduled action by its ID
 *
 * Flow:
 * 1. Fetch schedule entry from CMS storage by ID
 * 2. Return null if not found
 * 3. Transform CMS entry to IScheduledAction format
 */
class GetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private model: ScheduledActionModel.Interface
    ) {}

    async execute(scheduleId: string): Promise<Result<IScheduledAction, UseCaseAbstraction.Error>> {
        // Get entry from CMS
        const entryResult = await this.getEntryByIdUseCase.execute(this.model, scheduleId);

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(scheduleId));
            }

            return Result.fail(new ScheduledActionPersistenceError(entryResult.error));
        }

        const entry = entryResult.value;

        return Result.ok({
            id: entry.id,
            namespace: entry.values.namespace,
            actionType: entry.values.actionType,
            targetId: entry.values.targetId,
            scheduledBy: entry.values.scheduledBy,
            scheduledOn: new Date(entry.values.scheduledOn),
            payload: entry.values.payload,
            error: entry.values.error
        });
    }
}

export const GetScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetScheduledActionUseCaseImpl,
    dependencies: [GetEntryByIdUseCase, ScheduledActionModel]
});
