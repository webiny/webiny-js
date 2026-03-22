import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/scheduler.js";

export interface ISchedulePublishPageUseCaseParams {
    id: string;
    scheduleFor: Date;
}

export interface ISchedulePublishPageUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type ISchedulePublishPageUseCaseResponse = Promise<
    Result<ISchedulePublishPageUseCaseResult, ScheduleActionError>
>;

export interface ISchedulePublishPageUseCase {
    execute(params: ISchedulePublishPageUseCaseParams): ISchedulePublishPageUseCaseResponse;
}

/** Schedule a page for future publishing. */
export const SchedulePublishPageUseCase = createAbstraction<ISchedulePublishPageUseCase>(
    "WbScheduler/SchedulePublishPageUseCase"
);

export namespace SchedulePublishPageUseCase {
    export type Interface = ISchedulePublishPageUseCase;
    export type Error = ScheduleActionError;
    export type Params = ISchedulePublishPageUseCaseParams;
    export type Result = ISchedulePublishPageUseCaseResponse;
}
