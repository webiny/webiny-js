import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/scheduler.js";

export interface IScheduleUnpublishRedirectUseCaseParams {
    id: string;
    tenant: string;
    scheduleFor: Date;
}

export interface IScheduleUnpublishRedirectUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type IScheduleUnpublishRedirectUseCaseResponse = Promise<
    Result<IScheduleUnpublishRedirectUseCaseResult, ScheduleActionError>
>;

export interface IScheduleUnpublishRedirectUseCase {
    execute(
        params: IScheduleUnpublishRedirectUseCaseParams
    ): IScheduleUnpublishRedirectUseCaseResponse;
}

/** Schedule a redirect for future unpublishing. */
export const ScheduleUnpublishRedirectUseCase =
    createAbstraction<IScheduleUnpublishRedirectUseCase>(
        "WbScheduler/ScheduleUnpublishRedirectUseCase"
    );

export namespace ScheduleUnpublishRedirectUseCase {
    export type Interface = IScheduleUnpublishRedirectUseCase;
    export type Error = ScheduleActionError;
    export type Params = IScheduleUnpublishRedirectUseCaseParams;
    export type Result = IScheduleUnpublishRedirectUseCaseResponse;
}
