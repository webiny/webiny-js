import { Result } from "@webiny/feature/api";
import {
    type ISchedulePageActionPayload,
    SchedulePageActionUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { IScheduledAction } from "@webiny/api-scheduler";
import { ScheduleActionUseCase } from "@webiny/api-scheduler";
import { RunActionUseCase } from "@webiny/api-scheduler";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/abstractions.js";

const WB_PAGE_NAMESPACE = "Wb/Page";

/**
 * Schedules a WB page action (publish or unpublish).
 *
 * Flow:
 * 1. If immediately=true, use RunAction for immediate execution (no title needed).
 * 2. Otherwise, validate scheduleFor, fetch page to get title metadata.
 * 3. Use ScheduleAction with page title for display in the scheduler UI.
 */
class SchedulePageActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private scheduleActionUseCase: ScheduleActionUseCase.Interface,
        private runActionUseCase: RunActionUseCase.Interface,
        private getPageByIdUseCase: GetPageByIdUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IScheduledAction<ISchedulePageActionPayload>, UseCaseAbstraction.Error>> {
        const payload: ISchedulePageActionPayload = { _type: "Wb/Page" };

        // Handle immediate execution — RunAction executes now, no title needed.
        if (input.immediately) {
            const result = await this.runActionUseCase.execute<ISchedulePageActionPayload>({
                namespace: WB_PAGE_NAMESPACE,
                actionType: input.actionType,
                targetId: input.targetId,
                payload
            });

            if (result.isFail()) {
                return Result.fail(result.error);
            }

            return Result.ok(result.value);
        }

        // Validate scheduleFor is provided for future scheduling.
        if (!input.scheduleFor) {
            throw new Error("scheduleFor is required when immediately is not true");
        }

        // Fetch page to get title for display in the scheduler UI.
        const pageResult = await this.getPageByIdUseCase.execute(input.targetId);
        if (pageResult.isFail()) {
            return Result.fail(pageResult.error);
        }

        const page = pageResult.value;
        const title = page.properties?.title || "Unknown page title";

        // Schedule with title metadata.
        const scheduleResult = await this.scheduleActionUseCase.execute<ISchedulePageActionPayload>(
            {
                namespace: WB_PAGE_NAMESPACE,
                actionType: input.actionType,
                targetId: input.targetId,
                title,
                scheduleFor: input.scheduleFor,
                payload
            }
        );

        if (scheduleResult.isFail()) {
            return Result.fail(scheduleResult.error);
        }

        return Result.ok(scheduleResult.value);
    }
}

export const SchedulePageActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: SchedulePageActionUseCaseImpl,
    dependencies: [ScheduleActionUseCase, RunActionUseCase, GetPageByIdUseCase]
});
