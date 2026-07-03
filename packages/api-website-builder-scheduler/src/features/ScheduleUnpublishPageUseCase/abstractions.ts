import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/scheduler.js";

export interface IScheduleUnpublishPageUseCaseParams {
    id: string;
    tenant: string;
    scheduleFor: Date;
}

export interface IScheduleUnpublishPageUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type IScheduleUnpublishPageUseCaseResponse = Promise<
    Result<IScheduleUnpublishPageUseCaseResult, ScheduleActionError>
>;

export interface IScheduleUnpublishPageUseCase {
    execute(params: IScheduleUnpublishPageUseCaseParams): IScheduleUnpublishPageUseCaseResponse;
}

/** Schedule a page for future unpublishing. */
export const ScheduleUnpublishPageUseCase = createAbstraction<IScheduleUnpublishPageUseCase>(
    "WbScheduler/ScheduleUnpublishPageUseCase"
);

export namespace ScheduleUnpublishPageUseCase {
    export type Interface = IScheduleUnpublishPageUseCase;
    export type Error = ScheduleActionError;
    export type Params = IScheduleUnpublishPageUseCaseParams;
    export type Result = IScheduleUnpublishPageUseCaseResponse;
}
