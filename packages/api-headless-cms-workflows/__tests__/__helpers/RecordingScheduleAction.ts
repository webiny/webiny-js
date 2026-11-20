import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IScheduledAction } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/exports/api/scheduler.js";

/** Every schedule request that reached the scheduler (past the workflows guard). */
export const scheduledRequests: ScheduleActionUseCase.Params[] = [];

class RecordingScheduleAction implements ScheduleActionUseCase.Interface {
    public async execute<T extends GenericRecord>(
        params: ScheduleActionUseCase.Params
    ): Promise<Result<IScheduledAction<T>, ScheduleActionUseCase.Error>> {
        scheduledRequests.push(params);
        const scheduled = {
            id: "schedule-1",
            tenant: params.tenant,
            title: "Scheduled",
            namespace: params.namespace,
            actionType: params.actionType,
            targetId: params.targetId,
            scheduledBy: { id: "id-12345678", type: "admin", displayName: "John Doe" },
            scheduledFor: params.scheduleFor,
            payload: {} as T,
            error: undefined
        };
        return Result.ok(scheduled);
    }
}

/** The scheduler without storage or timers (`legacyPlugins`); the workflows guard decorates it. */
export const recordScheduleAction = (container: Container) => {
    container.register(
        ScheduleActionUseCase.createImplementation({
            implementation: RecordingScheduleAction,
            dependencies: []
        })
    );
};
