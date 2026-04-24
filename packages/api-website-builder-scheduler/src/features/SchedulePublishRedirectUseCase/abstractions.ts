import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/scheduler.js";

export interface ISchedulePublishRedirectUseCaseParams {
    id: string;
    scheduleFor: Date;
}

export interface ISchedulePublishRedirectUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type ISchedulePublishRedirectUseCaseResponse = Promise<
    Result<ISchedulePublishRedirectUseCaseResult, ScheduleActionError>
>;

export interface ISchedulePublishRedirectUseCase {
    execute(params: ISchedulePublishRedirectUseCaseParams): ISchedulePublishRedirectUseCaseResponse;
}

/** Schedule a redirect for future publishing. */
export const SchedulePublishRedirectUseCase = createAbstraction<ISchedulePublishRedirectUseCase>(
    "WbScheduler/SchedulePublishRedirectUseCase"
);

export namespace SchedulePublishRedirectUseCase {
    export type Interface = ISchedulePublishRedirectUseCase;
    export type Error = ScheduleActionError;
    export type Params = ISchedulePublishRedirectUseCaseParams;
    export type Result = ISchedulePublishRedirectUseCaseResponse;
}
